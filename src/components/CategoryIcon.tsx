import { Icon } from '@iconify/react';

interface CategoryIconProps {
  categoryId: string;
  size?: number;
}

export function CategoryIcon({ categoryId, size = 32 }: CategoryIconProps) {

  const iconMap: Record<string, string> = {
    // Physical
    temperature: 'lucide:thermometer-sun',
    length: 'lucide:ruler',
    area: 'lucide:grid-3x3',
    volume: 'streamline-flex-color:cube',
    mass: 'lucide:scale',
    pressure: 'lucide:gauge',
    acceleration: 'lucide:activity',
    speed: 'lucide:gauge',
    angle: 'lucide:rotate-cw',
    time: 'lucide:clock',

    // Electrical
    power: 'lucide:zap',
    energy: 'lucide:zap',
    charge: 'lucide:battery-charging',
    frequency: 'lucide:waves',
    resistance: 'lucide:minus-circle',
    voltage: 'lucide:bolt',
    current: 'lucide:plug',

    // Lifestyle
    'fuel-consumption': 'lucide:fuel',
    'fuel-volume': 'lucide:fuel',
    'ring-size': 'streamline-sharp-color:ring',
    'mens-shoe-size': 'twemoji:mans-shoe',
    'womens-shoe-size': 'noto:high-heeled-shoe',
    cooking: 'lucide:chef-hat',

    // Scientific / Data
    data: 'lucide:database',
    'network-bandwidth': 'lucide:network',
    illuminance: 'lucide:sun',
    'wind-speed': 'lucide:wind',
    concentration: 'lucide:droplet',
    radioactivity: 'lucide:radiation',
    'radiation-dose': 'iconoir:radiation',
  };

  const iconName = iconMap[categoryId] || 'lucide:help-circle';

  return (
    <div className="category-icon" style={{ color: 'inherit' }}>
      <Icon icon={iconName} width={size} height={size} />
    </div>
  );
}
