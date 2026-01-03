import { useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { CategoryIcon } from '../components/CategoryIcon';
import './CategorySelect.css';

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  tags: string[];
  filterGroup: string;
}

const categories: Category[] = [
  // Physical
  {
    id: 'length',
    name: 'Length',
    icon: 'length',
    description: 'Distance, height, size',
    tags: ['distance', 'height', 'size', 'measurement', 'meter', 'foot'],
    filterGroup: 'Physical',
  },
  {
    id: 'area',
    name: 'Area',
    icon: 'area',
    description: 'Surface and coverage',
    tags: ['surface', 'coverage', 'space', 'square'],
    filterGroup: 'Physical',
  },
  {
    id: 'volume',
    name: 'Volume',
    icon: 'volume',
    description: 'Capacity and space',
    tags: ['capacity', 'space', 'liquid', 'liter', 'gallon'],
    filterGroup: 'Physical',
  },
  {
    id: 'mass',
    name: 'Mass',
    icon: 'mass',
    description: 'Weight and matter',
    tags: ['weight', 'matter', 'mass', 'kilogram', 'pound'],
    filterGroup: 'Physical',
  },
  {
    id: 'pressure',
    name: 'Pressure',
    icon: 'pressure',
    description: 'Force per area',
    tags: ['force', 'atmospheric', 'psi', 'pascal', 'bar'],
    filterGroup: 'Physical',
  },
  {
    id: 'acceleration',
    name: 'Acceleration',
    icon: 'acceleration',
    description: 'Rate of velocity change',
    tags: ['velocity', 'gravity', 'physics'],
    filterGroup: 'Physical',
  },
  {
    id: 'speed',
    name: 'Speed',
    icon: 'speed',
    description: 'Velocity and pace',
    tags: ['velocity', 'pace', 'fast', 'slow', 'mph', 'kmh'],
    filterGroup: 'Physical',
  },
  {
    id: 'temperature',
    name: 'Temperature',
    icon: 'temperature',
    description: 'Heat and cold',
    tags: ['heat', 'cold', 'celsius', 'fahrenheit', 'kelvin'],
    filterGroup: 'Physical',
  },
  {
    id: 'angle',
    name: 'Angle',
    icon: 'angle',
    description: 'Angular measurement',
    tags: ['degree', 'radian', 'rotation', 'circle'],
    filterGroup: 'Physical',
  },
  {
    id: 'time',
    name: 'Time',
    icon: 'time',
    description: 'Duration and intervals',
    tags: ['duration', 'intervals', 'hours', 'minutes', 'seconds'],
    filterGroup: 'Physical',
  },
  // Electrical
  {
    id: 'power',
    name: 'Power',
    icon: 'power',
    description: 'Energy transfer rate',
    tags: ['watt', 'kilowatt', 'horsepower', 'energy'],
    filterGroup: 'Electrical',
  },
  {
    id: 'energy',
    name: 'Energy',
    icon: 'energy',
    description: 'Work and heat',
    tags: ['joule', 'calorie', 'kwh', 'btu'],
    filterGroup: 'Electrical',
  },
  {
    id: 'charge',
    name: 'Electric Charge',
    icon: 'charge',
    description: 'Electrical quantity',
    tags: ['coulomb', 'ampere-hour', 'battery'],
    filterGroup: 'Electrical',
  },
  {
    id: 'frequency',
    name: 'Frequency',
    icon: 'frequency',
    description: 'Cycles per time',
    tags: ['hertz', 'khz', 'mhz', 'ghz', 'oscillation'],
    filterGroup: 'Electrical',
  },
  {
    id: 'resistance',
    name: 'Electric Resistance',
    icon: 'resistance',
    description: 'Opposition to current',
    tags: ['ohm', 'resistor', 'impedance'],
    filterGroup: 'Electrical',
  },
  {
    id: 'voltage',
    name: 'Electric Potential',
    icon: 'voltage',
    description: 'Electrical potential difference',
    tags: ['volt', 'potential', 'electricity'],
    filterGroup: 'Electrical',
  },
  {
    id: 'current',
    name: 'Electric Current',
    icon: 'current',
    description: 'Flow of charge',
    tags: ['ampere', 'amp', 'electricity', 'flow'],
    filterGroup: 'Electrical',
  },
  // Lifestyle
  {
    id: 'fuel-consumption',
    name: 'Fuel Consumption',
    icon: 'fuel-consumption',
    description: 'Vehicle efficiency',
    tags: ['mpg', 'fuel', 'gas', 'mileage', 'efficiency'],
    filterGroup: 'Lifestyle',
  },
  {
    id: 'fuel-volume',
    name: 'Fuel Volume',
    icon: 'fuel-volume',
    description: 'Fuel tank capacity',
    tags: ['fuel', 'tank', 'gas', 'petrol', 'diesel'],
    filterGroup: 'Lifestyle',
  },
  {
    id: 'ring-size',
    name: 'Ring Size',
    icon: 'ring-size',
    description: 'International ring size conversions',
    tags: ['ring', 'jewelry', 'size', 'diameter', 'us', 'uk', 'eu', 'japan'],
    filterGroup: 'Lifestyle',
  },
  {
    id: 'mens-shoe-size',
    name: "Men's Shoe Size",
    icon: 'mens-shoe-size',
    description: "International men's shoe size conversions",
    tags: ['shoe', 'footwear', 'size', 'mens', 'us', 'uk', 'eu', 'cm'],
    filterGroup: 'Lifestyle',
  },
  {
    id: 'womens-shoe-size',
    name: "Women's Shoe Size",
    icon: 'womens-shoe-size',
    description: "International women's shoe size conversions",
    tags: ['shoe', 'footwear', 'size', 'womens', 'us', 'uk', 'eu', 'china'],
    filterGroup: 'Lifestyle',
  },
  {
    id: 'cooking',
    name: 'Cooking',
    icon: 'cooking',
    description: 'Recipe measurements',
    tags: ['cup', 'tablespoon', 'teaspoon', 'recipe', 'kitchen'],
    filterGroup: 'Lifestyle',
  },
  // Scientific
  {
    id: 'illuminance',
    name: 'Illuminance',
    icon: 'illuminance',
    description: 'Light intensity',
    tags: ['light', 'lux', 'brightness', 'lumens'],
    filterGroup: 'Scientific',
  },
  {
    id: 'wind-speed',
    name: 'Wind Speed',
    icon: 'wind-speed',
    description: 'Air velocity',
    tags: ['wind', 'weather', 'beaufort', 'knots'],
    filterGroup: 'Scientific',
  },
  {
    id: 'concentration',
    name: 'Concentration',
    icon: 'concentration',
    description: 'Mass-based solution strength',
    tags: ['ppm', 'percent', 'solution', 'chemistry'],
    filterGroup: 'Scientific',
  },
  {
    id: 'radioactivity',
    name: 'Radioactivity',
    icon: 'radioactivity',
    description: 'Nuclear decay rate',
    tags: ['becquerel', 'curie', 'radiation', 'nuclear'],
    filterGroup: 'Scientific',
  },
  {
    id: 'radiation-dose',
    name: 'Radiation Dose',
    icon: 'radiation-dose',
    description: 'Absorbed and equivalent radiation dose units',
    tags: ['gray', 'sievert', 'rad', 'rem', 'dose', 'absorbed', 'equivalent'],
    filterGroup: 'Scientific',
  },
  // Data / Digital
  {
    id: 'data',
    name: 'Information Storage',
    icon: 'data',
    description: 'Digital data size',
    tags: ['storage', 'digital', 'bytes', 'gigabytes', 'bit'],
    filterGroup: 'Data / Digital',
  },
  {
    id: 'network-bandwidth',
    name: 'Network Bandwidth',
    icon: 'network-bandwidth',
    description: 'Data transfer rate',
    tags: ['speed', 'internet', 'mbps', 'gbps', 'download'],
    filterGroup: 'Data / Digital',
  },
];

const filterGroups = ['All', 'Physical', 'Electrical', 'Scientific', 'Lifestyle', 'Data / Digital'];

interface CategorySelectProps {
  onSelectCategory?: (categoryId: string, currentFilter: string) => void;
}

export function CategorySelect({ onSelectCategory }: CategorySelectProps) {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState(() => {
    // Restore filter from navigation state if returning from converter
    const state = location.state as { previousFilter?: string } | null;
    return state?.previousFilter || 'All';
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const filteredCategories = categories.filter((category) => {
    const matchesSearch =
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter = selectedFilter === 'All' || category.filterGroup === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  const handleCategoryClick = (categoryId: string) => {
    if (onSelectCategory) {
      onSelectCategory(categoryId, selectedFilter);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.cursor = 'grabbing';
    scrollRef.current.style.userSelect = 'none';
  };

  const handleMouseLeave = () => {
    if (!scrollRef.current) return;
    isDragging.current = false;
    scrollRef.current.style.cursor = 'grab';
    scrollRef.current.style.userSelect = 'auto';
  };

  const handleMouseUp = () => {
    if (!scrollRef.current) return;
    isDragging.current = false;
    scrollRef.current.style.cursor = 'grab';
    scrollRef.current.style.userSelect = 'auto';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 2;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  return (
    <div className="category-select">
      <header className="category-select-header">
        <h1>Unit Converter</h1>
      </header>

      <div className="category-select-search">
        <input
          type="text"
          className="category-search-input"
          placeholder="Search categories"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div
        ref={scrollRef}
        className="category-filter-pills"
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        {filterGroups.map((filter) => (
          <button
            key={filter}
            className={`category-filter-pill ${selectedFilter === filter ? 'active' : ''}`}
            onClick={() => setSelectedFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="category-select-grid">
        {filteredCategories.map((category) => (
          <button
            key={category.id}
            className="category-select-card"
            onClick={() => handleCategoryClick(category.id)}
          >
            <span className="category-select-icon">
              <CategoryIcon categoryId={category.id} size={40} />
            </span>
            <span className="category-select-name">{category.name}</span>
            <span className="category-select-description">{category.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
