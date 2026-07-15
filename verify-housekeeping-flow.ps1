$ErrorActionPreference = 'Stop'

function Login($account) {
  $body = @{ login_account = $account; password = '123456' } | ConvertTo-Json
  $res = Invoke-RestMethod -Method Post -Uri 'http://localhost:9999/api/auth/login' -ContentType 'application/json' -Body $body
  return $res.token
}

$receptionistToken = Login 'receptionist'
$housekeepingToken = Login 'housekeeping'
$managerToken = Login 'manager'

$authRec = @{ Authorization = "Bearer $receptionistToken" }
$authHk = @{ Authorization = "Bearer $housekeepingToken" }
$authMgr = @{ Authorization = "Bearer $managerToken" }

function Get-RoomByIdForReceptionist($roomId) {
  $response = Invoke-RestMethod -Method Get -Uri 'http://localhost:9999/api/housekeeping/rooms?limit=300' -Headers $authRec
  return $response.data | Where-Object { $_._id -eq $roomId } | Select-Object -First 1
}

$roomsRes = Invoke-RestMethod -Method Get -Uri 'http://localhost:9999/api/housekeeping/rooms?limit=300' -Headers $authRec
$rooms = $roomsRes.data
if (-not $rooms -or $rooms.Count -lt 2) {
  throw 'Need at least 2 rooms in DB for integration verification'
}

$roomA = $rooms | Select-Object -First 1
$roomB = $rooms | Select-Object -Skip 1 -First 1

Invoke-RestMethod -Method Put -Uri ("http://localhost:9999/api/manager/rooms/{0}" -f $roomA._id) -Headers $authMgr -ContentType 'application/json' -Body (@{ status = 'Occupied' } | ConvertTo-Json) | Out-Null
Invoke-RestMethod -Method Put -Uri ("http://localhost:9999/api/manager/rooms/{0}" -f $roomB._id) -Headers $authMgr -ContentType 'application/json' -Body (@{ status = 'Occupied' } | ConvertTo-Json) | Out-Null

# Flow 1: normal cleaning cycle
$checkout1 = @{ room_number = $roomA.roomName; receptionistNote = 'Checkout confirmed'; priority = 'high'; cleaningType = 'Checkout Cleaning'; checkoutTime = [DateTime]::UtcNow.ToString('o') } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:9999/api/housekeeping/checkout/confirm' -Headers $authRec -ContentType 'application/json' -Body $checkout1 | Out-Null

$taskList1 = Invoke-RestMethod -Method Get -Uri ("http://localhost:9999/api/housekeeping/tasks?room_number={0}" -f $roomA.roomName) -Headers $authRec
$task1 = $taskList1.data | Select-Object -First 1

Invoke-RestMethod -Method Patch -Uri ("http://localhost:9999/api/housekeeping/tasks/{0}/accept" -f $task1.id) -Headers $authHk | Out-Null
$roomAfterAccept = Get-RoomByIdForReceptionist $roomA._id

Invoke-RestMethod -Method Patch -Uri ("http://localhost:9999/api/housekeeping/tasks/{0}/start" -f $task1.id) -Headers $authHk | Out-Null
$roomAfterStart = Get-RoomByIdForReceptionist $roomA._id

Invoke-RestMethod -Method Patch -Uri ("http://localhost:9999/api/housekeeping/tasks/{0}/complete" -f $task1.id) -Headers $authHk | Out-Null
$roomAfterComplete = Get-RoomByIdForReceptionist $roomA._id

# Flow 2: maintenance branch
$checkout2 = @{ room_number = $roomB.roomName; receptionistNote = 'Checkout with possible damage check'; priority = 'high'; cleaningType = 'Checkout Cleaning'; checkoutTime = [DateTime]::UtcNow.ToString('o') } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:9999/api/housekeeping/checkout/confirm' -Headers $authRec -ContentType 'application/json' -Body $checkout2 | Out-Null

$taskList2 = Invoke-RestMethod -Method Get -Uri ("http://localhost:9999/api/housekeeping/tasks?room_number={0}" -f $roomB.roomName) -Headers $authRec
$task2 = $taskList2.data | Select-Object -First 1
Invoke-RestMethod -Method Patch -Uri ("http://localhost:9999/api/housekeeping/tasks/{0}/accept" -f $task2.id) -Headers $authHk | Out-Null
Invoke-RestMethod -Method Patch -Uri ("http://localhost:9999/api/housekeeping/tasks/{0}/start" -f $task2.id) -Headers $authHk | Out-Null

$issueBody = @{ task_id = $task2.id; room_number = $roomB.roomName; category = 'Equipment Damage'; priority = 'high'; description = 'Air conditioner not working'; note = 'Found during cleaning' } | ConvertTo-Json
$issueRes = Invoke-RestMethod -Method Post -Uri 'http://localhost:9999/api/housekeeping/report-issue' -Headers $authHk -ContentType 'application/json' -Body $issueBody
$maintenanceId = $issueRes.data.maintenanceRequest.id

$taskAfterIssue = (Invoke-RestMethod -Method Get -Uri ("http://localhost:9999/api/housekeeping/tasks/{0}" -f $task2.id) -Headers $authHk).data
$roomAfterIssue = Get-RoomByIdForReceptionist $roomB._id

Invoke-RestMethod -Method Patch -Uri ("http://localhost:9999/api/housekeeping/maintenance-requests/{0}/assign" -f $maintenanceId) -Headers $authMgr -ContentType 'application/json' -Body (@{ assignedTech = 'Technical Team A'; note = 'Assigned by manager' } | ConvertTo-Json) | Out-Null
Invoke-RestMethod -Method Patch -Uri ("http://localhost:9999/api/housekeeping/maintenance-requests/{0}/status" -f $maintenanceId) -Headers $authMgr -ContentType 'application/json' -Body (@{ status = 'InProgress'; note = 'Repair started' } | ConvertTo-Json) | Out-Null
Invoke-RestMethod -Method Patch -Uri ("http://localhost:9999/api/housekeeping/maintenance-requests/{0}/status" -f $maintenanceId) -Headers $authMgr -ContentType 'application/json' -Body (@{ status = 'Resolved'; note = 'Repair done' } | ConvertTo-Json) | Out-Null
Invoke-RestMethod -Method Patch -Uri ("http://localhost:9999/api/housekeeping/maintenance-requests/{0}/complete" -f $maintenanceId) -Headers $authMgr -ContentType 'application/json' -Body (@{ note = 'Manager approved completion' } | ConvertTo-Json) | Out-Null

$roomAfterMaintenanceComplete = Get-RoomByIdForReceptionist $roomB._id

$newTasksRoomB = (Invoke-RestMethod -Method Get -Uri ("http://localhost:9999/api/housekeeping/tasks?room_number={0}" -f $roomB.roomName) -Headers $authRec).data
$newCleaningTask = $newTasksRoomB | Where-Object { $_.status -eq 'Assigned' } | Select-Object -First 1

Invoke-RestMethod -Method Patch -Uri ("http://localhost:9999/api/housekeeping/tasks/{0}/accept" -f $newCleaningTask.id) -Headers $authHk | Out-Null
Invoke-RestMethod -Method Patch -Uri ("http://localhost:9999/api/housekeeping/tasks/{0}/start" -f $newCleaningTask.id) -Headers $authHk | Out-Null
Invoke-RestMethod -Method Patch -Uri ("http://localhost:9999/api/housekeeping/tasks/{0}/complete" -f $newCleaningTask.id) -Headers $authHk | Out-Null
$roomAfterSecondClean = Get-RoomByIdForReceptionist $roomB._id

$result = [ordered]@{
  flow1 = [ordered]@{
    room = $roomA.roomName
    afterAccept = $roomAfterAccept.status
    afterStart = $roomAfterStart.status
    afterComplete = $roomAfterComplete.status
  }
  flow2 = [ordered]@{
    room = $roomB.roomName
    taskStatusAfterIssue = $taskAfterIssue.status
    roomStatusAfterIssue = $roomAfterIssue.status
    roomStatusAfterMaintenanceComplete = $roomAfterMaintenanceComplete.status
    newCleaningTaskCreated = [bool]$newCleaningTask
    roomStatusAfterSecondCleaning = $roomAfterSecondClean.status
  }
}

$result | ConvertTo-Json -Depth 10
