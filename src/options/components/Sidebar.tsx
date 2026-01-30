import type { SectionId } from '../types/sections';

interface SidebarProps {
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
}

interface NavGroup {
  title: string;
  items: { id: SectionId; label: string }[];
}

const navGroups: NavGroup[] = [
  {
    title: 'Behavior',
    items: [
      { id: 'global', label: 'Global Control' },
      { id: 'persite', label: 'Per-Site Settings' },
    ],
  },
  {
    title: 'Visual',
    items: [
      { id: 'display', label: 'Display Settings' },
      { id: 'position', label: 'Toast Position' },
      { id: 'visual', label: 'Visual Customization' },
    ],
  },
  {
    title: 'Data',
    items: [
      { id: 'errors', label: 'Error Types' },
      { id: 'history', label: 'History' },
      { id: 'ignored', label: 'Ignored Errors' },
    ],
  },
  {
    title: 'About',
    items: [{ id: 'about', label: 'About' }],
  },
];

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {navGroups.map((group) => (
          <div key={group.title} className="nav-group">
            <h3 className="nav-group-title">{group.title}</h3>
            <ul className="nav-list">
              {group.items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSectionChange(item.id)}
                    className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                    aria-current={activeSection === item.id ? 'page' : undefined}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
