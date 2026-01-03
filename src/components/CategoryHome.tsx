import { useNavigate } from 'react-router-dom';

export function CategoryHome() {
  const navigate = useNavigate();

  const unitCategories = [
    { id: 'length', name: 'Length', icon: '📏' },
  ];

  return (
    <div className="category-home">
      <header className="header">
        <h1>Unit Converter</h1>
        <p>Select a category</p>
      </header>

      <div className="category-grid">
        {unitCategories.map((category) => (
          <button
            key={category.id}
            className="category-card"
            onClick={() => navigate(`/converter/${category.id}`)}
          >
            <span className="category-icon">{category.icon}</span>
            <span className="category-name">{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
