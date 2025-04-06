# Configuración de Protección de Ramas en GitHub

Este documento proporciona instrucciones para configurar la protección de ramas en GitHub, completando la implementación de Git Flow para el proyecto TaskMaster Todo App.

## Pasos para Configurar Protección de Ramas

### 1. Acceder a la Configuración del Repositorio

1. Ve al repositorio en GitHub: [https://github.com/reyer3/taskmaster-todo-app](https://github.com/reyer3/taskmaster-todo-app)
2. Haz clic en la pestaña "Settings" (Configuración)
3. En el menú lateral, selecciona "Branches" (Ramas)

### 2. Configurar Reglas de Protección para la Rama `main`

1. En la sección "Branch protection rules", haz clic en "Add rule" (Añadir regla)
2. En "Branch name pattern", ingresa `main`
3. Configura las siguientes opciones:

   - ✅ "Require a pull request before merging" (Requerir una pull request antes de fusionar)
     - ✅ "Require approvals" (Requerir aprobaciones): 1
     - ✅ "Dismiss stale pull request approvals when new commits are pushed" (Descartar aprobaciones obsoletas cuando se envían nuevos commits)
     
   - ✅ "Require status checks to pass before merging" (Requerir que las comprobaciones de estado pasen antes de fusionar)
     - ✅ "Require branches to be up to date before merging" (Requerir que las ramas estén actualizadas antes de fusionar)
     - En "Status checks that are required" (Comprobaciones de estado requeridas): 
       - Busca y selecciona las comprobaciones que hayas configurado en GitHub Actions

   - ✅ "Require conversation resolution before merging" (Requerir resolución de conversaciones antes de fusionar)
   
   - ✅ "Restrict who can push to matching branches" (Restringir quién puede hacer push a ramas coincidentes)
     - Añade a los administradores del proyecto

4. Haz clic en "Create" (Crear) para guardar la regla

### 3. Configurar Reglas de Protección para la Rama `develop`

1. En la sección "Branch protection rules", haz clic nuevamente en "Add rule" (Añadir regla)
2. En "Branch name pattern", ingresa `develop`
3. Configura las siguientes opciones (similares a las de `main`, pero potencialmente menos estrictas):

   - ✅ "Require a pull request before merging" (Requerir una pull request antes de fusionar)
     - ✅ "Require approvals" (Requerir aprobaciones): 1
     
   - ✅ "Require status checks to pass before merging" (Requerir que las comprobaciones de estado pasen antes de fusionar)
     - ✅ "Require branches to be up to date before merging" (Requerir que las ramas estén actualizadas antes de fusionar)
     - Selecciona las mismas comprobaciones que para `main`
   
   - ✅ "Restrict who can push to matching branches" (Restringir quién puede hacer push a ramas coincidentes)
     - Añade a los administradores del proyecto

4. Haz clic en "Create" (Crear) para guardar la regla

## Verificación

Para verificar que la protección de ramas está funcionando correctamente:

1. Intenta hacer un push directamente a `main` o `develop` desde tu entorno local:
   ```bash
   git checkout main
   # Realizar algún cambio
   git add .
   git commit -m "Prueba de protección de ramas"
   git push origin main
   ```

2. GitHub debería rechazar el push con un mensaje indicando que necesitas crear una pull request.

3. Crea una pull request de prueba y verifica que:
   - No se puede fusionar hasta que pase las comprobaciones de estado
   - Requiere al menos una aprobación antes de fusionar
   - Las conversaciones deben resolverse antes de fusionar (para `main`)

## Configuración de GitHub Actions para CI

Para complementar la protección de ramas, asegúrate de tener configurado un flujo de trabajo básico de GitHub Actions:

1. Crea o edita el archivo `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [ develop, main ]
  pull_request:
    branches: [ develop, main ]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: |
          cd backend
          npm install
      - name: Run linting
        run: |
          cd backend
          npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: |
          cd backend
          npm install
      - name: Run tests
        run: |
          cd backend
          npm test
```

## Conclusión

Con estas configuraciones, has implementado correctamente:

1. Protección para las ramas `main` y `develop`
2. Flujo de trabajo de GitHub Actions para CI
3. Cumplimiento completo del modelo Git Flow

Estas medidas aseguran que:
- No se pueden realizar cambios directamente en ramas principales
- Todo el código se revisa antes de ser fusionado
- Las pruebas automáticas ayudan a mantener la calidad del código
- El equipo sigue un flujo de trabajo estructurado y organizado
