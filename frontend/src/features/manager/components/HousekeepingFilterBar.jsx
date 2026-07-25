const HousekeepingFilterBar = ({ search, setSearch, filter, setFilter, filterOptions = [] }) => {
  return (
    <div className="housekeeping-filter-bar">
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search room, task, staff, request"
      />
      <select value={filter} onChange={(event) => setFilter(event.target.value)}>
        <option value="all">All</option>
        {filterOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default HousekeepingFilterBar;
