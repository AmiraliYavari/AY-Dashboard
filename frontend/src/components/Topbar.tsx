import { useLayout } from '../context/LayoutContext';
import { useTheme } from '../context/ThemeContext';

interface TopbarProps {
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
}

export default function Topbar({ searchPlaceholder = 'جست‌وجو...', onSearch }: TopbarProps) {
  const { openMenu } = useLayout();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="topbar">
      <button className="icon-btn menu-btn" onClick={openMenu} aria-label="باز کردن منو">
        <span className="material-symbols-outlined">menu</span>
      </button>

      <label className="search-box">
        <span className="material-symbols-outlined">search</span>
        <input
          type="search"
          placeholder={searchPlaceholder}
          onChange={(e) => onSearch?.(e.target.value)}
        />
      </label>

      <div className="topbar-actions">
        <button className="icon-btn" aria-label="اعلان‌ها">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button
          className="icon-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'حالت روشن' : 'حالت تیره'}
          title={theme === 'dark' ? 'حالت روشن' : 'حالت تیره'}
        >
          <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
        </button>
      </div>
    </header>
  );
}
