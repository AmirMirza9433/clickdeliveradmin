import React from "react";

export const DATE_FILTER_OPTIONS = [
  { id: "all", label: "All Time" },
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "year", label: "This Year" },
  { id: "custom", label: "Custom" },
];

export const DATE_FILTER_LABELS = {
  all: "All Time",
  today: "Today",
  yesterday: "Yesterday",
  week: "This Week",
  month: "This Month",
  year: "This Year",
  custom: "Custom Range",
};

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (dateString) => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const getDateRange = (type, customStartDate, customEndDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (type) {
    case "today": {
      const end = new Date(today);
      end.setHours(23, 59, 59, 999);
      return { start: today, end };
    }

    case "yesterday": {
      const start = new Date(today);
      start.setDate(today.getDate() - 1);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    case "week": {
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    case "month": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    case "year": {
      const start = new Date(today.getFullYear(), 0, 1);
      const end = new Date(today.getFullYear(), 11, 31);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    case "custom":
      if (customStartDate && customEndDate) {
        return {
          start: parseLocalDate(customStartDate),
          end: parseLocalDate(customEndDate),
        };
      }
      return null;

    default:
      return null;
  }
};

export const getDateFilterParams = (
  filterType,
  customStartDate,
  customEndDate,
) => {
  const range = getDateRange(filterType, customStartDate, customEndDate);
  if (!range) return {};

  return {
    startDate: formatLocalDate(range.start),
    endDate: formatLocalDate(range.end),
  };
};

export const getCityFilterParams = (selectedCity) =>
  selectedCity && selectedCity !== "all" ? { city: selectedCity } : {};

export const AdminCityFilter = ({ cities, selectedCity, setSelectedCity }) => (
  <div className="dashboard-city-filter">
    <label htmlFor="admin-section-city">City</label>
    <select
      id="admin-section-city"
      value={selectedCity}
      onChange={(e) => setSelectedCity(e.target.value)}
      className="dashboard-city-select"
    >
      <option value="all">All Cities</option>
      {cities.map((city) => (
        <option key={city._id} value={city.name}>
          {city.name}
        </option>
      ))}
    </select>
  </div>
);

const AdminDateFilter = ({
  filterType,
  setFilterType,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  style = {},
  leadingContent = null,
}) => (
  <div
    className="glass-panel"
    style={{
      padding: "0.75rem",
      marginBottom: "1.5rem",
      display: "flex",
      flexWrap: "wrap",
      gap: "0.5rem",
      alignItems: "center",
      ...style,
    }}
  >
    {leadingContent}
    {DATE_FILTER_OPTIONS.map((option) => (
      <button
        key={option.id}
        onClick={() => setFilterType(option.id)}
        style={{
          padding: "0.5rem 1rem",
          borderRadius: "8px",
          border: "none",
          background:
            filterType === option.id
              ? "var(--accent-primary)"
              : "rgba(255,255,255,0.05)",
          color: filterType === option.id ? "white" : "var(--text-muted)",
          fontWeight: 500,
          fontSize: "0.875rem",
          cursor: "pointer",
          transition: "all 0.2s ease",
          whiteSpace: "nowrap",
        }}
      >
        {option.label}
      </button>
    ))}

    {filterType === "custom" && (
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          marginLeft: "0.25rem",
        }}
      >
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
          }}
        >
          From Date
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "var(--surface-color)",
              color: "var(--text-main)",
              fontSize: "0.875rem",
            }}
          />
        </label>
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
          }}
        >
          To Date
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "var(--surface-color)",
              color: "var(--text-main)",
              fontSize: "0.875rem",
            }}
          />
        </label>
      </div>
    )}
  </div>
);

export default AdminDateFilter;
