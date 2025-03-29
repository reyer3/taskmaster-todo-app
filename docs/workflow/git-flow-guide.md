# Guía Práctica de Git Flow para TaskMaster

Esta guía proporciona instrucciones específicas para trabajar con Git Flow en el proyecto TaskMaster.

## Configuración Inicial

### Instalación de Git Flow (opcional)

Git Flow es una serie de extensiones de Git que facilita el uso del flujo de trabajo. Puedes trabajar con Git Flow manualmente o instalar las extensiones:

```bash
# En macOS
brew install git-flow-avh

# En Ubuntu/Debian
apt-get install git-flow

# En Windows con Chocolatey
choco install gitflow-avh
```

### Configuración del repositorio (solo una vez)

Si tienes instalada la extensión Git Flow:

```bash
git flow init -d
```

Esto configurará automáticamente las ramas con los valores predeterminados.

## Flujo de Trabajo Diario

### 1. Antes de Empezar a Trabajar

Siempre actualiza tu rama `develop` local:

```bash
git checkout develop
git pull origin develop
```

### 2. Crear una Nueva Característica

#### Con extensión Git Flow:
```bash
git flow feature start nombre-de-la-caracteristica
```

#### Sin extensión (Git estándar):
```bash
git checkout -b feature/nombre-de-la-caracteristica develop
```

### 3. Desarrollo y Commits

Trabaja normalmente en tu rama de característica y realiza commits frecuentes usando la convención de mensajes:

```bash
git add .
git commit -m "feat: descripción del cambio"
```

Convenciones de mensajes de commit:
- `feat:` Nueva característica
- `fix:` Corrección de errores
- `docs:` Cambios en documentación
- `style:` Cambios que no afectan el significado del código (espacios, formato, etc.)
- `refactor:` Cambio de código que no corrige un error ni añade una característica
- `test:` Añadir o corregir pruebas
- `chore:` Cambios en el proceso de construcción o herramientas auxiliares

### 4. Actualizar tu Rama de Característica

Mientras trabajas, es recomendable mantener tu rama sincronizada con `develop`:

```bash
git checkout develop
git pull origin develop
git checkout feature/nombre-de-la-caracteristica
git merge develop
```

### 5. Completar una Característica

Cuando hayas terminado de trabajar en tu característica:

#### Con extensión Git Flow:
```bash
git flow feature finish nombre-de-la-caracteristica
```

#### Sin extensión (Git estándar):
```bash
git checkout develop
git merge --no-ff feature/nombre-de-la-caracteristica
git push origin develop
git branch -d feature/nombre-de-la-caracteristica
```

### 6. Crear un Pull Request

En lugar de fusionar directamente con `develop`, es recomendable crear un Pull Request:

1. Empuja tu rama de característica a GitHub:
   ```bash
   git push origin feature/nombre-de-la-caracteristica
   ```

2. Ve a GitHub y crea un Pull Request de `feature/nombre-de-la-caracteristica` a `develop`.

3. Asigna revisores y espera la aprobación antes de fusionar.

## Releases

### Crear una Release

#### Con extensión Git Flow:
```bash
git flow release start x.y.z
```

#### Sin extensión (Git estándar):
```bash
git checkout -b release/x.y.z develop
```

Realiza los ajustes finales, actualiza el número de versión, etc.

### Finalizar una Release

#### Con extensión Git Flow:
```bash
git flow release finish x.y.z
```

#### Sin extensión (Git estándar):
```bash
git checkout main
git merge --no-ff release/x.y.z
git tag -a vx.y.z -m "Versión x.y.z"
git checkout develop
git merge --no-ff release/x.y.z
git branch -d release/x.y.z
git push --all
git push --tags
```

## Hotfixes

### Crear un Hotfix

#### Con extensión Git Flow:
```bash
git flow hotfix start x.y.z
```

#### Sin extensión (Git estándar):
```bash
git checkout -b hotfix/x.y.z main
```

### Finalizar un Hotfix

#### Con extensión Git Flow:
```bash
git flow hotfix finish x.y.z
```

#### Sin extensión (Git estándar):
```bash
git checkout main
git merge --no-ff hotfix/x.y.z
git tag -a vx.y.z -m "Versión x.y.z"
git checkout develop
git merge --no-ff hotfix/x.y.z
git branch -d hotfix/x.y.z
git push --all
git push --tags
```

## Diagrama del Flujo

```
main    ────────────────────────────────────────▶
         ↑                                       ↑
         │                                       │
develop  ─┼─────────┬─────────┬─────────┬────────┼─▶
         │         ↑│        ↑│        ↑│       ↑│
         │         ││        ││        ││       ││
feature   │         │         │         │
branches  ▼─────────┘         │         │        │
                   ▼─────────┘         │        │
                               ▼────────┘        │
hotfix                                           │
branches  ───────────────────────────────────────┘
```

## Consejos y Buenas Prácticas

1. **Ramas pequeñas y específicas**: Crea ramas de característica para tareas concretas, no para conjuntos grandes de cambios.

2. **Commits frecuentes**: Realiza commits pequeños y frecuentes que representen cambios lógicos y completos.

3. **Pull Requests descriptivos**: Incluye una descripción clara, capturas de pantalla si es necesario, y referencias a issues.

4. **Actualiza regularmente**: Mantén tus ramas sincronizadas con `develop` para evitar conflictos grandes.

5. **Revisión de código**: Todas las fusiones a `develop` deben pasar por revisión de código mediante Pull Requests.

6. **No subas a `main` directamente**: `main` solo recibe cambios a través de ramas de `release` o `hotfix`.

7. **Releases semanticas**: Sigue el versionado semántico (MAJOR.MINOR.PATCH) para las releases y hotfixes.

## Solución de Problemas Comunes

### Conflictos de Fusión

Si encuentras conflictos al fusionar:

1. Resuelve los conflictos marcados en los archivos
2. `git add` los archivos resueltos
3. `git commit` para completar la fusión
4. Continúa con el flujo normal

### Revertir Cambios

Si necesitas deshacer cambios:

- Para revertir commits: `git revert <commit-hash>`
- Para deshacer cambios locales: `git checkout -- <file>`
- Para cambiar a una versión anterior: `git checkout <tag/branch/commit>`

### Ayuda con Git Flow

Si utilizas la extensión Git Flow, puedes obtener ayuda con:

```bash
git flow feature help
git flow release help
git flow hotfix help
```
