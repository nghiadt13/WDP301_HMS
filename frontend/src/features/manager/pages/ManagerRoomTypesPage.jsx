import ManagerShell from '../components/ManagerShell.jsx';

const ManagerRoomTypesPage = () => (
  <ManagerShell title="Room Type Management">
    <div className="manager-main-column">
      <section className="manager-card">
        <div className="manager-card-heading">
          <div>
            <h2>Room Types</h2>
            <p className="manager-muted">
              This sidebar item is kept for the shared Hotelify template. Room Type backend is not included in Quang's current scope.
            </p>
          </div>
        </div>
      </section>
    </div>
  </ManagerShell>
);

export default ManagerRoomTypesPage;
