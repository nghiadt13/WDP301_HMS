import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

import axiosClient from '../api/axiosClient';

const dayMs = 24 * 60 * 60 * 1000;

const pad = (value) => String(value).padStart(2, '0');

const toDateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseDateKey = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const addMonths = (date, months) => new Date(date.getFullYear(), date.getMonth() + months, 1);

const addDays = (date, days) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

const getMonthStart = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const formatShortDate = (value) => {
  if (!value) {
    return 'Chọn ngày';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: 'short'
  }).format(parseDateKey(value));
};

const formatMonth = (date) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric'
  }).format(date);

const getMonthDays = (monthDate) => {
  const start = getMonthStart(monthDate);
  const end = addMonths(start, 1);
  const days = [];

  for (let i = 0; i < start.getDay(); i += 1) {
    days.push(null);
  }

  for (let cursor = start; cursor < end; cursor = addDays(cursor, 1)) {
    days.push(new Date(cursor));
  }

  return days;
};

const isBetween = (dateKey, startKey, endKey) => {
  if (!startKey || !endKey) {
    return false;
  }

  return dateKey > startKey && dateKey < endKey;
};

const DateRangePicker = ({
  adults = '1',
  children = '0',
  className = '',
  disabled = false,
  inline = false,
  onApply,
  roomId = '',
  triggerLabel = 'Select dates',
  triggerText = '',
  value = { checkIn: '', checkOut: '' }
}) => {
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  const [isOpen, setIsOpen] = useState(inline);
  const [visibleMonth, setVisibleMonth] = useState(() => getMonthStart(parseDateKey(value.checkIn) || today));
  const [draft, setDraft] = useState(value);
  const [calendarDates, setCalendarDates] = useState({});
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState('');

  useEffect(() => {
    setDraft(value);
    setVisibleMonth(getMonthStart(parseDateKey(value.checkIn) || today));
  }, [today, value.checkIn, value.checkOut]);

  useEffect(() => {
    const loadCalendar = async () => {
      if (!(inline || isOpen) || !roomId) {
        setCalendarDates({});
        setCalendarError('');
        return;
      }

      setIsCalendarLoading(true);
      setCalendarError('');

      try {
        const response = await axiosClient.get(`/rooms/${roomId}/calendar`, {
          params: {
            from: toDateKey(visibleMonth),
            months: 2,
            adults,
            children
          }
        });
        const nextDates = {};
        (response.data.dates || []).forEach((dateInfo) => {
          nextDates[dateInfo.date] = dateInfo;
        });
        setCalendarDates(nextDates);
      } catch (error) {
        setCalendarDates({});
        setCalendarError(error.response?.data?.message || 'Không thể tải lịch phòng.');
      } finally {
        setIsCalendarLoading(false);
      }
    };

    loadCalendar();
  }, [adults, children, inline, isOpen, roomId, visibleMonth]);

  const displayText =
    triggerText ||
    (value.checkIn && value.checkOut
      ? `${formatShortDate(value.checkIn)} → ${formatShortDate(value.checkOut)}`
      : 'Chọn ngày lưu trú');

  const unavailableDateKeys = useMemo(
    () => Object.entries(calendarDates)
      .filter(([, dateInfo]) => dateInfo.isUnavailable)
      .map(([dateKey]) => dateKey),
    [calendarDates]
  );

  const hasUnavailableInRange = useMemo(() => {
    if (!draft.checkIn || !draft.checkOut) {
      return false;
    }

    for (
      let cursor = parseDateKey(draft.checkIn);
      cursor < parseDateKey(draft.checkOut);
      cursor = addDays(cursor, 1)
    ) {
      const key = toDateKey(cursor);
      if (unavailableDateKeys.includes(key)) {
        return true;
      }
    }

    return false;
  }, [draft.checkIn, draft.checkOut, unavailableDateKeys]);

  const isDateDisabled = (date) => {
    const dateKey = toDateKey(date);
    return date < today || Boolean(calendarDates[dateKey]?.isUnavailable);
  };

  const handleDateClick = (date) => {
    if (isDateDisabled(date)) {
      return;
    }

    const dateKey = toDateKey(date);

    if (!draft.checkIn || draft.checkOut || dateKey <= draft.checkIn) {
      setDraft({ checkIn: dateKey, checkOut: '' });
      return;
    }

    setDraft((current) => ({ ...current, checkOut: dateKey }));
  };

  const handleDone = () => {
    if (!draft.checkIn || !draft.checkOut || hasUnavailableInRange) {
      return;
    }

    onApply?.(draft);
    if (!inline) {
      setIsOpen(false);
    }
  };

  const renderMonth = (monthDate) => (
    <div className="date-range-month" key={toDateKey(monthDate)}>
      <h3>{formatMonth(monthDate)}</h3>
      <div className="date-range-weekdays">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>
      <div className="date-range-days">
        {getMonthDays(monthDate).map((date, index) => {
          if (!date) {
            return <span className="date-range-empty" key={`empty-${index}`} />;
          }

          const dateKey = toDateKey(date);
          const isStart = draft.checkIn === dateKey;
          const isEnd = draft.checkOut === dateKey;
          const isRange = isBetween(dateKey, draft.checkIn, draft.checkOut);
          const isDisabled = isDateDisabled(date);

          return (
            <button
              className={[
                isStart || isEnd ? 'is-selected' : '',
                isRange ? 'is-in-range' : '',
                isDisabled ? 'is-disabled' : ''
              ].filter(Boolean).join(' ')}
              type="button"
              disabled={isDisabled}
              key={dateKey}
              onClick={() => handleDateClick(date)}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={`date-range-picker${inline ? ' date-range-picker-inline' : ''} ${className}`}>
      {!inline ? (
        <button
          className="date-range-trigger"
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((current) => !current)}
        >
          <CalendarDays size={18} />
          <span>
            <small>{triggerLabel}</small>
            <strong>{displayText}</strong>
          </span>
        </button>
      ) : null}

      {inline || isOpen ? (
        <div className={`date-range-popover${inline ? ' date-range-inline' : ''}`}>
          <div className="date-range-nav">
            <button
              type="button"
              disabled={visibleMonth <= getMonthStart(today)}
              onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
              aria-label="Previous month"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
              aria-label="Next month"
            >
              <ChevronRight size={22} />
            </button>
          </div>

          <div className="date-range-calendar">
            {renderMonth(visibleMonth)}
            {renderMonth(addMonths(visibleMonth, 1))}
          </div>

          <footer className="date-range-footer">
            <span>
              {isCalendarLoading
                ? 'Đang tải lịch phòng...'
                : calendarError || (draft.checkIn ? (draft.checkOut ? 'Đã chọn thời gian lưu trú' : 'Chọn ngày trả phòng') : 'Chọn ngày nhận phòng')}
              {hasUnavailableInRange ? ' - Khoảng ngày này có ngày hết phòng.' : ''}
            </span>
            <button type="button" disabled={!draft.checkIn || !draft.checkOut || hasUnavailableInRange} onClick={handleDone}>
              Done
            </button>
          </footer>
        </div>
      ) : null}
    </div>
  );
};

export default DateRangePicker;
