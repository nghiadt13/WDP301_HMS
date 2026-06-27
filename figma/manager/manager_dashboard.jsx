import React, { useState } from 'react';
import { 
  LayoutDashboard, MessageSquare, Calendar, Megaphone, BedDouble, 
  Sparkles, Box, Wallet, Star, LogIn, Search, MessageCircle, 
  Bell, ChevronDown, MoreHorizontal, CheckCircle2, XCircle, 
  Clock, CheckSquare, Plus, User, FileText, ArrowUpRight, ArrowDownRight, MapPin
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active, badge, hasSub }) => (
  <div className={`flex items-center justify-between px-4 py-3 mb-1 rounded-xl cursor-pointer transition-colors ${active ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}>
    <div className="flex items-center gap-3">
      <Icon size={20} className={active ? 'text-blue-600' : 'text-gray-400'} />
      <span className="text-sm">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {badge && <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{badge}</span>}
      {hasSub && <ChevronDown size={16} className="text-gray-400" />}
    </div>
  </div>
);

const StatCard = ({ title, value, trend, trendValue, icon: Icon, iconBg, trendType, subtitle }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-full ${iconBg}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
    <div>
      <p className="text-gray-500 text-sm mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
    </div>
    <div className="flex items-center gap-2 mt-4 text-xs">
      <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md font-medium ${
        trendType === 'up' ? 'bg-lime-100 text-lime-700' : 'bg-red-100 text-red-600'
      }`}>
        {trendType === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {trendValue}
      </span>
      <span className="text-gray-400">{subtitle}</span>
    </div>
  </div>
);

export default function App() {
  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-sm overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[260px] bg-white border-r border-gray-100 flex flex-col overflow-y-auto">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <LayoutDashboard size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-gray-800 tracking-tight">Hotelify</span>
        </div>

        <nav className="flex-1 px-4">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active />
          <SidebarItem icon={MessageSquare} label="Inbox" />
          <SidebarItem icon={Calendar} label="Calendar" />
          <SidebarItem icon={Megaphone} label="Campaigns" hasSub />
          <SidebarItem icon={BedDouble} label="Rooms" hasSub />
          <SidebarItem icon={Sparkles} label="Housekeeping" />
          <SidebarItem icon={Box} label="Inventory" />
          <SidebarItem icon={Wallet} label="Finance" hasSub />
          <SidebarItem icon={Star} label="Reviews" badge="5" />
          <SidebarItem icon={LogIn} label="Register & Login" />
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <img 
              src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80" 
              alt="Hotel Promo" 
              className="w-full h-24 object-cover rounded-xl mb-3"
            />
            <h4 className="font-semibold text-gray-800 text-sm mb-1">Manage Smarter, Serve Better</h4>
            <p className="text-xs text-gray-500 mb-3 leading-tight">Automate check-ins, monitor occupancy, and track performance effortlessly.</p>
            <button className="w-full bg-[#D4ED31] hover:bg-[#c4db2d] text-gray-800 font-medium py-2 rounded-xl text-sm transition-colors">
              Upgrade to Pro
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between shrink-0">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search placeholder" 
                className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-full w-[300px] focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <button className="p-2 bg-gray-50 rounded-full text-gray-600 hover:bg-gray-100 transition-colors">
                <MessageCircle size={20} />
              </button>
              <button className="p-2 bg-gray-50 rounded-full text-gray-600 hover:bg-gray-100 transition-colors">
                <Bell size={20} />
              </button>
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <img 
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" 
                alt="Profile" 
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-gray-800 leading-tight">Polina Streward</p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8 flex gap-6">
          
          {/* Left/Center Column */}
          <div className="flex-1 flex flex-col gap-6">
            
            {/* Top Row: Greeting & Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Hi, Polina</h2>
                  <p className="text-gray-500 text-xs mt-1">Saturday, 25 November 2028</p>
                </div>
                <div className="bg-blue-500 bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl text-white mt-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                  <p className="text-blue-100 text-xs mb-1 relative z-10">Total Earnings</p>
                  <div className="flex items-end gap-3 relative z-10">
                    <h3 className="text-2xl font-bold">$58,240</h3>
                  </div>
                  <div className="flex justify-between items-center mt-2 relative z-10">
                    <span className="text-[10px] text-blue-100">from last week</span>
                    <span className="bg-[#D4ED31] text-gray-800 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <ArrowUpRight size={10} /> +15.6%
                    </span>
                  </div>
                </div>
              </div>

              <StatCard 
                title="New Reservations" value="128" 
                trendType="up" trendValue="+12.4%" subtitle="from last week"
                icon={CheckSquare} iconBg="bg-blue-100 text-blue-500"
              />
              <StatCard 
                title="Guests Checked In" value="94" 
                trendType="up" trendValue="+8.7%" subtitle="week-over-week"
                icon={LogIn} iconBg="bg-blue-400"
              />
              <StatCard 
                title="Guests Checked Out" value="76" 
                trendType="down" trendValue="-3.2%" subtitle="from previous week"
                icon={LogIn} iconBg="bg-blue-200"
              />
            </div>

            {/* Middle Row: Charts */}
            <div className="grid grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-gray-800">Revenue</h3>
                  <button className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                    Last 6 Months <ChevronDown size={14} />
                  </button>
                </div>
                <div className="h-[200px] w-full flex">
                  {/* Y-Axis Labels */}
                  <div className="w-12 h-[150px] flex flex-col justify-between text-[10px] text-gray-400 py-1 shrink-0">
                    <span>$400K</span><span>$300K</span><span>$200K</span><span>$100K</span><span>$0</span>
                  </div>
                  {/* Chart Area */}
                  <div className="flex-1 h-[150px] relative">
                    {/* SVG Chart */}
                    <svg viewBox="0 0 350 150" className="w-full h-full" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {/* Grid lines */}
                      <g className="text-gray-200" strokeWidth="1" stroke="currentColor" strokeDasharray="3 3">
                        <line x1="0" y1="0" x2="350" y2="0" />
                        <line x1="0" y1="37.5" x2="350" y2="37.5" />
                        <line x1="0" y1="75" x2="350" y2="75" />
                        <line x1="0" y1="112.5" x2="350" y2="112.5" />
                        <line x1="0" y1="150" x2="350" y2="150" />
                      </g>
                      {/* Area fill */}
                      <path d="M0,75 C30,75 50,110 80,110 C120,110 140,20 180,20 C220,20 240,100 280,100 C320,100 330,50 350,50 L350,150 L0,150 Z" fill="url(#gradient)" />
                      {/* Line path */}
                      <path d="M0,75 C30,75 50,110 80,110 C120,110 140,20 180,20 C220,20 240,100 280,100 C320,100 330,50 350,50" fill="none" stroke="#3B82F6" strokeWidth="3" />
                      {/* Tooltip dot */}
                      <circle cx="140" cy="40" r="5" fill="white" stroke="#3B82F6" strokeWidth="3" />
                      <line x1="140" y1="40" x2="140" y2="150" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4 4" />
                    </svg>
                    {/* Tooltip HTML overlay */}
                    <div className="absolute top-0 left-[40%] bg-white border border-gray-100 shadow-lg rounded-lg p-2 text-center transform -translate-x-1/2 -translate-y-full">
                      <p className="text-[10px] text-gray-400 mb-0.5">Total Revenue</p>
                      <p className="text-sm font-bold text-gray-800">$315,060</p>
                    </div>
                    {/* X-Axis Labels */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-gray-400 transform translate-y-6">
                      <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Occupancy Trend */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-gray-800">Occupancy Trend</h3>
                  <button className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                    Last 7 Days <ChevronDown size={14} />
                  </button>
                </div>
                <div className="flex gap-4 mb-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500"><div className="w-2.5 h-2.5 rounded-sm bg-blue-500"></div> Occupied</div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500"><div className="w-2.5 h-2.5 rounded-sm bg-gray-100"></div> Available</div>
                </div>
                <div className="h-[180px] w-full flex relative mt-2">
                   {/* Y-Axis */}
                   <div className="w-8 h-[140px] flex flex-col justify-between text-[10px] text-gray-400 shrink-0">
                    <span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
                  </div>
                  
                  {/* Bars container */}
                  <div className="flex-1 h-[140px] flex items-end justify-between relative pl-2">
                     {/* Background lines */}
                     <div className="absolute top-0 left-0 right-0 h-full flex flex-col justify-between border-b border-gray-100 z-0">
                        <div className="w-full border-t border-gray-100 border-dashed"></div>
                        <div className="w-full border-t border-gray-100 border-dashed"></div>
                        <div className="w-full border-t border-gray-100 border-dashed"></div>
                        <div className="w-full border-t border-gray-100 border-dashed"></div>
                        <div className="w-full border-t border-gray-100 border-dashed opacity-0"></div>
                     </div>

                    {[70, 45, 60, 80, 70, 90, 55].map((val, i) => (
                      <div key={i} className="flex flex-col items-center group relative z-10 w-8 h-full">
                        <div className="w-full flex-1 bg-gray-100 rounded-t-md relative overflow-hidden">
                          <div className="absolute bottom-0 w-full bg-blue-500 rounded-t-md transition-all" style={{ height: `${val}%` }}></div>
                        </div>
                        <span className="text-[10px] text-gray-400 mt-2 whitespace-nowrap absolute -bottom-6">1{i+2} Jun</span>
                        
                        {/* Tooltip on hover */}
                        {i === 4 && (
                           <div className="absolute -top-12 bg-white border border-gray-100 shadow-md p-2 rounded z-20 text-xs w-28 text-center -translate-x-1/2 left-1/2">
                              <p className="text-[10px] text-gray-400 mb-1">15 July 2028</p>
                              <div className="flex items-center justify-between"><div className="w-2 h-2 bg-blue-500 rounded-full"></div><span>72 Rooms</span></div>
                              <div className="flex items-center justify-between"><div className="w-2 h-2 bg-gray-200 rounded-full"></div><span className="text-gray-500">28 Rooms</span></div>
                           </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Source & Rating */}
            <div className="grid grid-cols-2 gap-6">
              
              {/* Booking Source */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-gray-800">Booking Source</h3>
                  <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={18}/></button>
                </div>
                
                <div className="flex items-center mt-4">
                  <div className="w-1/2 relative flex justify-center items-center">
                    {/* SVG Donut Chart */}
                    <svg width="140" height="140" viewBox="0 0 140 140" className="transform -rotate-90">
                      {/* Background circle */}
                      <circle cx="70" cy="70" r="55" fill="none" stroke="#F3F4F6" strokeWidth="12" />
                      {/* Direct Website (Blue) 42% */}
                      <circle cx="70" cy="70" r="55" fill="none" stroke="#3B82F6" strokeWidth="12" strokeDasharray="345" strokeDashoffset="200" strokeLinecap="round" />
                      {/* OTA (Lime) 33% */}
                      <circle cx="70" cy="70" r="55" fill="none" stroke="#D4ED31" strokeWidth="12" strokeDasharray="345" strokeDashoffset="260" strokeLinecap="round" className="origin-center rotate-[150deg]" />
                      {/* Walk-in (Gray) 15% */}
                      <circle cx="70" cy="70" r="55" fill="none" stroke="#9CA3AF" strokeWidth="12" strokeDasharray="345" strokeDashoffset="290" strokeLinecap="round" className="origin-center rotate-[270deg]" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-blue-50 p-3 rounded-full text-blue-500">
                        <BedDouble size={24} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-1/2 space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">Direct Website</span><span className="font-bold">42%</span></div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full"><div className="bg-blue-500 h-1.5 rounded-full" style={{width: '42%'}}></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">Online Travel Agencies (OTA)</span><span className="font-bold">33%</span></div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full"><div className="bg-[#D4ED31] h-1.5 rounded-full" style={{width: '33%'}}></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">Walk-in Guests</span><span className="font-bold">15%</span></div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full"><div className="bg-gray-400 h-1.5 rounded-full" style={{width: '15%'}}></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">Corporate Partnerships</span><span className="font-bold">10%</span></div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full"><div className="bg-gray-800 h-1.5 rounded-full" style={{width: '10%'}}></div></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Overall Rating */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-gray-800">Overall Rating</h3>
                  <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={18}/></button>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-1/2 flex flex-col items-center justify-center relative mt-4">
                    {/* SVG Gauge */}
                    <svg width="180" height="100" viewBox="0 0 180 100">
                      {/* Background arc */}
                      <path d="M 20 90 A 70 70 0 0 1 160 90" fill="none" stroke="#F3F4F6" strokeWidth="20" strokeLinecap="round" />
                      {/* Progress arc (approx 4.7/5.0 = 94%) */}
                      <path d="M 20 90 A 70 70 0 0 1 160 90" fill="none" stroke="#3B82F6" strokeWidth="20" strokeLinecap="round" strokeDasharray="206 220" />
                      {/* Needle pivot */}
                      <circle cx="90" cy="85" r="8" fill="#D4ED31" className="z-10 relative"/>
                      <circle cx="90" cy="85" r="3" fill="#3B82F6" />
                      {/* Needle line */}
                      <path d="M 90 85 L 145 80" stroke="#D4ED31" strokeWidth="6" strokeLinecap="round" />
                    </svg>
                    <div className="text-center mt-[-10px]">
                      <p className="text-xs text-gray-400 font-medium">Total Review</p>
                      <p className="text-2xl font-bold text-gray-800 text-blue-500 mt-1">4.7 / 5.0</p>
                      <p className="text-[10px] text-gray-400 mt-1">1,248 Guests</p>
                    </div>
                  </div>
                  
                  <div className="w-1/2 space-y-2.5">
                    {[
                      { name: 'Cleanliness', score: 4.8 },
                      { name: 'Comfort', score: 4.6 },
                      { name: 'Service / Staff', score: 4.9 },
                      { name: 'Facilities / Amenities', score: 4.5 },
                      { name: 'Value for Money', score: 4.6 },
                      { name: 'Location', score: 4.7 }
                    ].map(item => (
                      <div key={item.name} className="flex items-center text-xs">
                        <div className="w-24 bg-blue-500 text-white px-2 py-0.5 rounded-l text-[10px] truncate">{item.name}</div>
                        <div className="flex-1 bg-gray-100 h-5 rounded-r flex items-center relative overflow-hidden">
                           <div className="bg-[#D4ED31] h-full" style={{width: `${(item.score/5)*100}%`}}></div>
                        </div>
                        <div className="w-10 text-right font-medium flex items-center justify-end gap-1 text-gray-700">
                          {item.score} <Star size={10} className="fill-blue-500 text-blue-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Booking List Table */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-gray-800 text-lg">Booking List</h3>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search guest, status, etc" 
                      className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs w-64 focus:outline-none focus:ring-1 focus:ring-blue-200"
                    />
                  </div>
                  <button className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 border border-gray-100 px-4 py-2 rounded-lg">
                    All Status <ChevronDown size={14} />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="text-gray-400 text-xs bg-gray-50/50">
                      <th className="font-medium px-4 py-3 rounded-l-lg">Booking ID & Guest Name <span className="inline-block ml-1">↕</span></th>
                      <th className="font-medium px-4 py-3">Room Type <span className="inline-block ml-1">↕</span></th>
                      <th className="font-medium px-4 py-3">Room No. <span className="inline-block ml-1">↕</span></th>
                      <th className="font-medium px-4 py-3">Duration <span className="inline-block ml-1">↕</span></th>
                      <th className="font-medium px-4 py-3">Check-In & Check-Out <span className="inline-block ml-1">↕</span></th>
                      <th className="font-medium px-4 py-3 rounded-r-lg">Status <span className="inline-block ml-1">↕</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[
                      { id: '#BKG-1024', name: 'Emily Carter', type: 'Deluxe Suite', room: '210', dur: '3 Nights', date: 'Mar 10 - Mar 13, 2035', status: 'Checked-In', statusColor: 'bg-[#D4ED31]/30 text-gray-700' },
                      { id: '#BKG-1025', name: 'Daniel Wong', type: 'Superior Room', room: '315', dur: '2 Nights', date: 'Mar 11 - Mar 13, 2035', status: 'Pending', statusColor: 'bg-red-100 text-red-600' },
                      { id: '#BKG-1026', name: 'Sophia Rivera', type: 'Executive Suite', room: '108', dur: '4 Nights', date: 'Mar 09 - Mar 13, 2035', status: 'Reserved', statusColor: 'bg-blue-100 text-blue-600' },
                      { id: '#BKG-1027', name: 'Liam Johnson', type: 'Deluxe Suite', room: '412', dur: '1 Nights', date: 'Mar 12 - Mar 13, 2035', status: 'Checked-Out', statusColor: 'bg-gray-100 text-gray-600' },
                      { id: '#BKG-1028', name: 'Hannah Lee', type: 'Standard Room', room: '205', dur: '5 Nights', date: 'Mar 10 - Mar 15, 2035', status: 'Checked-In', statusColor: 'bg-[#D4ED31]/30 text-gray-700' },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-4">
                          <p className="font-semibold text-gray-800">{row.id}</p>
                          <p className="text-gray-400 text-xs mt-0.5">{row.name}</p>
                        </td>
                        <td className="px-4 py-4 text-gray-600 flex items-center gap-2 mt-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div> {row.type}
                        </td>
                        <td className="px-4 py-4 text-gray-600">{row.room}</td>
                        <td className="px-4 py-4 text-gray-600">{row.dur}</td>
                        <td className="px-4 py-4 text-gray-600">{row.date}</td>
                        <td className="px-4 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${row.statusColor}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Text */}
             <div className="flex items-center justify-between text-xs text-gray-400 mt-4 pb-4">
                <div className="flex gap-4">
                   <span>Copyright © 2026 Hotelify</span>
                   <a href="#" className="hover:text-gray-600">Privacy Policy</a>
                   <a href="#" className="hover:text-gray-600">Term and conditions</a>
                   <a href="#" className="hover:text-gray-600">Contact</a>
                </div>
                <div className="flex gap-3">
                   {/* Mock Social Icons */}
                   <div className="w-5 h-5 rounded-full bg-gray-200"></div>
                   <div className="w-5 h-5 rounded-full bg-gray-200"></div>
                   <div className="w-5 h-5 rounded-full bg-gray-200"></div>
                   <div className="w-5 h-5 rounded-full bg-gray-200"></div>
                </div>
             </div>

          </div>

          {/* Right Sidebar (w-80 approx 320px) */}
          <div className="w-[320px] shrink-0 flex flex-col gap-6">
            
            {/* Room Availability */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-gray-800">Room Availability</h3>
                <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={18}/></button>
              </div>
              <div className="flex justify-between items-end mb-4">
                <span className="text-sm text-gray-500">Total All Rooms</span>
                <span className="text-3xl font-bold text-gray-800">120</span>
              </div>
              
              {/* Block Chart */}
              <div className="flex flex-wrap gap-1 mb-6">
                {/* 68 Occupied (Blue) */}
                {Array(68).fill(0).map((_,i) => <div key={`occ-${i}`} className="w-2.5 h-8 bg-blue-500 rounded-sm"></div>)}
                {/* 22 Reserved (Lime) */}
                {Array(22).fill(0).map((_,i) => <div key={`res-${i}`} className="w-2.5 h-8 bg-[#D4ED31] rounded-sm"></div>)}
                {/* 25 Available (Gray) */}
                {Array(25).fill(0).map((_,i) => <div key={`avl-${i}`} className="w-2.5 h-8 bg-gray-200 rounded-sm"></div>)}
                 {/* 5 Not Ready (Light Gray stripes mocked) */}
                {Array(5).fill(0).map((_,i) => <div key={`nr-${i}`} className="w-2.5 h-8 bg-gray-100 rounded-sm border border-gray-200"></div>)}
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-y-3 text-xs">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="font-bold">68</span><span className="text-gray-500">Occupied</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#D4ED31]"></div><span className="font-bold">25</span><span className="text-gray-500">Available</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-gray-800"></div><span className="font-bold">22</span><span className="text-gray-500">Reserved</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-gray-300"></div><span className="font-bold">5</span><span className="text-gray-500">Not Ready</span></div>
              </div>
            </div>

            {/* Tasks */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-gray-800">Tasks</h3>
                <button className="p-1 rounded-full bg-[#D4ED31] text-gray-800 hover:bg-[#c4db2d] transition-colors">
                  <Plus size={16} />
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { title: 'Confirm Group Booking for VIP Guests', date: 'March 12, 2035' },
                  { title: 'Update Room Maintenance Schedule', date: 'March 13, 2035' },
                  { title: 'Review Monthly Revenue Report', date: 'March 14, 2035' },
                  { title: 'Coordinate Staff Shift Assignments', date: 'March 15, 2035' }
                ].map((task, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-5 h-5 rounded border-2 border-gray-200 mt-0.5 shrink-0"></div>
                    <div className="bg-gray-50 p-3 rounded-lg flex-1">
                      <p className="text-sm font-medium text-gray-800 leading-tight mb-1">{task.title}</p>
                      <p className="text-xs text-gray-400">{task.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
               <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-gray-800">Recent Activities</h3>
                <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={18}/></button>
              </div>

              <div className="relative border-l border-gray-100 ml-4 space-y-6">
                {[
                  { user: 'Front Desk Admin', icon: User, color: 'bg-[#D4ED31]', text: 'Checked in Emily Carter to Room 210 (Deluxe Suite).', time: '09:45 AM' },
                  { user: 'Housekeeping Team', icon: Sparkles, color: 'bg-blue-500 text-white', text: 'Marked Room 305 as Clean & Ready.', time: '09:20 AM' },
                  { user: 'Manager approved', icon: CheckCircle2, color: 'bg-[#D4ED31]', text: 'Checked in Emily Carter to Room 210 (Deluxe Suite).', time: '08:50 AM' },
                  { user: 'Reservation Staff', icon: Calendar, color: 'bg-blue-500 text-white', text: 'Confirmed corporate booking for TechVision Ltd., 5 rooms reserved.', time: '08:30 AM' },
                  { user: 'System Update - Revenue report', icon: FileText, color: 'bg-[#D4ED31]', text: 'For March 2035 successfully generated and saved.', time: '08:00 AM' },
                  { user: 'System Update - Booking report', icon: FileText, color: 'bg-[#D4ED31]', text: 'For March 2035 successfully generated and saved.', time: '07:50 AM' },
                  { user: 'Housekeeping Team', icon: Sparkles, color: 'bg-blue-500 text-white', text: 'Marked Room 216 as Clean & Ready.', time: '07:20 AM' },
                  { user: 'Front Desk Admin', icon: User, color: 'bg-[#D4ED31]', text: 'Checked in Robert Dew to Room 118 (Standard Suite).', time: '06:00 AM' },
                ].map((act, i) => (
                  <div key={i} className="pl-6 relative">
                    <div className={`absolute -left-3.5 top-0 w-7 h-7 rounded-full flex items-center justify-center ${act.color} ring-4 ring-white`}>
                      <act.icon size={14} className={act.color.includes('text-white') ? '' : 'text-gray-700'} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{act.user}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{act.text}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}