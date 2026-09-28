interface TopbarProps {
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
}

export default function Topbar({ searchPlaceholder = 'جست‌وجو...', onSearch }: TopbarProps) {
  return (
    <div className="topbar">
      <div className="search-box">
        <span className="material-symbols-outlined">search</span>
        <input
          type="text"
          placeholder={searchPlaceholder}
          onChange={(e) => onSearch?.(e.target.value)}
        />
      </div>
      <div className="topbar-actions">
        <button className="icon-btn">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="icon-btn">
          <span className="material-symbols-outlined">dark_mode</span>
        </button>
      </div>
    </div>
  );
}
