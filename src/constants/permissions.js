import { DEPT_LIST } from './departments';

export const NAVIGATION = [
  {
    group: '',
    items: [
      { route: '/dashboard', key: 'dashboard', label: 'Dashboard' }
    ]
  },
  {
    group: 'Booking Management',
    items: [
      { route: '/bookings', key: 'bookings', label: 'Bookings' },
      { route: '/menu-finalize', key: 'menuFinalize', label: 'Menu Finalize' },
    ]
  },
  {
    group: 'Department Workflow',
    items: [
      { route: '/inform-to-chef', key: 'chef', label: 'Inform to Chef' },
      { route: '/tag-print', key: 'tagPrints', label: 'Tag Print' },
      { route: '/dress', key: 'dress', label: 'Dress' },
      { route: '/decor-list', key: 'decor', label: 'Decor List' },
      { route: '/crockery-list', key: 'crockery', label: 'Crockery List' },
      { route: '/kitchen-raw-material', key: 'kitchenRawMaterial', label: 'Kitchen & Raw Material' },
      { route: '/vegetables', key: 'vegetables', label: 'Vegetables' },
      { route: '/cheese-dairy-products', key: 'cheeseDairy', label: 'Cheese & Dairy Products' },
    ]
  },
  {
    group: 'Admin',
    items: [
      { route: '/masters', key: 'masters', label: 'Master Data', adminOnly: true },
      { route: '/settings', key: 'settings', label: 'Settings', adminOnly: true }
    ]
  }
];

export const ALL_PAGE_KEYS = ['dashboard', 'bookings', 'menuFinalize', 'masters', 'settings', ...DEPT_LIST.map(d => d.key)];
