// Zonas horarias más comunes
const commonTimezones = [
  'UTC',
  'America/Lima',
  'America/Bogota',
  'America/Santiago',
  'America/Mexico_City',
  'America/Los_Angeles',
  'America/New_York',
  'Europe/Madrid',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney'
];

const ProfileForm = ({ user, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    timezone: user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  
  // ... resto del código ...

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nombre */}
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium">
          Nombre completo
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:bg-dark-bg-secondary dark:text-dark-text-primary dark:border-dark-border"
          required
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium">
          Correo electrónico
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:bg-dark-bg-secondary dark:text-dark-text-primary dark:border-dark-border"
          required
        />
      </div>

      {/* Zona horaria */}
      <div className="space-y-2">
        <label htmlFor="timezone" className="block text-sm font-medium">
          Zona horaria
        </label>
        <select
          id="timezone"
          name="timezone"
          value={formData.timezone}
          onChange={handleInputChange}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:bg-dark-bg-secondary dark:text-dark-text-primary dark:border-dark-border"
        >
          <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>
            {Intl.DateTimeFormat().resolvedOptions().timeZone} (Actual)
          </option>
          {commonTimezones.map(tz => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 dark:text-dark-text-tertiary">
          Esta zona horaria se utilizará para validar fechas y mostrar calendarios.
        </p>
      </div>

      {/* ... resto del formulario ... */}
      
      <div className="flex justify-end space-x-3 pt-5">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-70"
        >
          {loading ? (
            <>
              <span className="animate-spin">↻</span>
              <span>Guardando...</span>
            </>
          ) : (
            'Guardar cambios'
          )}
        </button>
      </div>
    </form>
  );
}; 