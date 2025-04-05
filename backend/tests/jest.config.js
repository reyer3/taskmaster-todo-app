/**
 * Configuración de Jest para pruebas unitarias
 */
require("dotenv").config({ path: ".env" });

module.exports = {
  // Directorio raíz para búsqueda de tests
  rootDir: '../',
  
  // Entorno de ejecución
  testEnvironment: 'node',
  
  // Archivos a considerar como tests
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Archivos/directorios a ignorar
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  
  // Cobertura de código
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.spec.js',
    '!src/**/*.test.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'tests/coverage',
  
  // Umbrales de cobertura
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70
    }
  },
  
  // Mostrar output detallado
  verbose: true,
  
  // Configuración de mocks
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Archivos de configuración global para tests
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup-tests.js'
  ]
};
