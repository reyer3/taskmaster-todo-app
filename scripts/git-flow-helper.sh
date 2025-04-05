#!/bin/bash
# Git Flow Helper Script
# Este script proporciona comandos simples para trabajar con Git Flow.

# Colores para salida
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar ayuda
show_help() {
  echo -e "${BLUE}========== Git Flow Helper Script ==========${NC}"
  echo "Uso: ./git-flow-helper.sh [comando] [argumentos]"
  echo ""
  echo "Comandos disponibles:"
  echo -e "  ${GREEN}feature ${YELLOW}start ${NC}<nombre>    - Crear una nueva rama feature desde develop"
  echo -e "  ${GREEN}feature ${YELLOW}finish ${NC}<nombre>   - Finalizar una rama feature y fusionarla a develop"
  echo -e "  ${GREEN}release ${YELLOW}start ${NC}<versión>   - Crear una nueva rama release desde develop"
  echo -e "  ${GREEN}release ${YELLOW}finish ${NC}<versión>  - Finalizar una rama release y fusionarla a main y develop"
  echo -e "  ${GREEN}hotfix ${YELLOW}start ${NC}<versión>    - Crear una nueva rama hotfix desde main"
  echo -e "  ${GREEN}hotfix ${YELLOW}finish ${NC}<versión>   - Finalizar una rama hotfix y fusionarla a main y develop"
  echo -e "  ${GREEN}status                     ${NC}- Mostrar el estado actual de Git Flow"
  echo -e "  ${GREEN}help                       ${NC}- Mostrar esta ayuda"
  echo ""
  echo -e "${BLUE}==========================================${NC}"
}

# Función para verificar si estamos en un repositorio Git
check_git_repo() {
  if [ ! -d .git ]; then
    echo -e "${RED}Error: No estás en un repositorio Git.${NC}"
    exit 1
  fi
}

# Función para comprobar ramas existentes
check_branches() {
  # Asegurar que tenemos las últimas ramas remotas
  git fetch &> /dev/null

  # Verificar rama main
  if ! git show-ref --verify --quiet refs/heads/main; then
    echo -e "${RED}Error: La rama main no existe. Este script requiere una rama main.${NC}"
    exit 1
  fi

  # Verificar rama develop
  if ! git show-ref --verify --quiet refs/heads/develop; then
    echo -e "${RED}Error: La rama develop no existe. Este script requiere una rama develop.${NC}"
    echo -e "${YELLOW}¿Quieres crear la rama develop a partir de main? (s/n)${NC}"
    read answer
    if [ "$answer" = "s" ]; then
      git checkout main
      git pull
      git checkout -b develop
      git push origin develop
      echo -e "${GREEN}Rama develop creada y enviada al remoto.${NC}"
    else
      exit 1
    fi
  fi
}

# Función para mostrar estado actual
show_status() {
  check_git_repo
  current_branch=$(git rev-parse --abbrev-ref HEAD)
  
  echo -e "${BLUE}========== Estado de Git Flow ==========${NC}"
  echo -e "Rama actual: ${GREEN}$current_branch${NC}"
  
  echo ""
  echo -e "${YELLOW}Ramas principales:${NC}"
  if git show-ref --verify --quiet refs/heads/main; then
    echo -e "- main: ${GREEN}Existe${NC}"
  else
    echo -e "- main: ${RED}No existe${NC}"
  fi
  
  if git show-ref --verify --quiet refs/heads/develop; then
    echo -e "- develop: ${GREEN}Existe${NC}"
  else
    echo -e "- develop: ${RED}No existe${NC}"
  fi
  
  echo ""
  echo -e "${YELLOW}Ramas feature:${NC}"
  git branch | grep "feature/" || echo "No hay ramas feature"
  
  echo ""
  echo -e "${YELLOW}Ramas release:${NC}"
  git branch | grep "release/" || echo "No hay ramas release"
  
  echo ""
  echo -e "${YELLOW}Ramas hotfix:${NC}"
  git branch | grep "hotfix/" || echo "No hay ramas hotfix"
  
  echo -e "${BLUE}==========================================${NC}"
}

# Función para iniciar una rama feature
feature_start() {
  check_git_repo
  check_branches
  
  if [ -z "$1" ]; then
    echo -e "${RED}Error: Debes proporcionar un nombre para la rama feature.${NC}"
    echo "Uso: ./git-flow-helper.sh feature start <nombre>"
    exit 1
  fi
  
  feature_name=$1
  branch_name="feature/$feature_name"
  
  # Verificar si la rama ya existe
  if git show-ref --verify --quiet refs/heads/$branch_name; then
    echo -e "${RED}Error: La rama $branch_name ya existe.${NC}"
    exit 1
  fi
  
  # Crear la rama feature
  git checkout develop
  git pull
  git checkout -b $branch_name
  
  echo -e "${GREEN}Rama $branch_name creada con éxito desde develop.${NC}"
  echo -e "${YELLOW}Ahora puedes realizar cambios y hacer commits en esta rama.${NC}"
}

# Función para finalizar una rama feature
feature_finish() {
  check_git_repo
  check_branches
  
  if [ -z "$1" ]; then
    echo -e "${RED}Error: Debes proporcionar el nombre de la rama feature a finalizar.${NC}"
    echo "Uso: ./git-flow-helper.sh feature finish <nombre>"
    exit 1
  fi
  
  feature_name=$1
  branch_name="feature/$feature_name"
  
  # Verificar si la rama existe
  if ! git show-ref --verify --quiet refs/heads/$branch_name; then
    echo -e "${RED}Error: La rama $branch_name no existe.${NC}"
    exit 1
  fi
  
  # Finalizar la rama feature
  git checkout $branch_name
  git pull
  git checkout develop
  git pull
  
  echo -e "${YELLOW}¿Quieres fusionar la rama $branch_name a develop? (s/n)${NC}"
  read answer
  if [ "$answer" = "s" ]; then
    git merge --no-ff $branch_name -m "Merge feature '$feature_name' into develop"
    
    echo -e "${YELLOW}¿Quieres eliminar la rama $branch_name? (s/n)${NC}"
    read delete_answer
    if [ "$delete_answer" = "s" ]; then
      git branch -d $branch_name
      echo -e "${GREEN}Rama $branch_name eliminada localmente.${NC}"
      
      echo -e "${YELLOW}¿Quieres eliminar la rama $branch_name del remoto? (s/n)${NC}"
      read delete_remote_answer
      if [ "$delete_remote_answer" = "s" ]; then
        git push origin --delete $branch_name
        echo -e "${GREEN}Rama $branch_name eliminada del remoto.${NC}"
      fi
    fi
    
    git push origin develop
    echo -e "${GREEN}Rama $branch_name fusionada con develop y enviada al remoto.${NC}"
  else
    echo -e "${YELLOW}Operación cancelada. No se ha fusionado la rama.${NC}"
  fi
}

# Función para iniciar una rama release
release_start() {
  check_git_repo
  check_branches
  
  if [ -z "$1" ]; then
    echo -e "${RED}Error: Debes proporcionar un número de versión para la rama release.${NC}"
    echo "Uso: ./git-flow-helper.sh release start <versión>"
    exit 1
  fi
  
  version=$1
  branch_name="release/$version"
  
  # Verificar si la rama ya existe
  if git show-ref --verify --quiet refs/heads/$branch_name; then
    echo -e "${RED}Error: La rama $branch_name ya existe.${NC}"
    exit 1
  fi
  
  # Crear la rama release
  git checkout develop
  git pull
  git checkout -b $branch_name
  
  echo -e "${GREEN}Rama $branch_name creada con éxito desde develop.${NC}"
  echo -e "${YELLOW}Ahora puedes realizar ajustes finales antes de la release.${NC}"
}

# Función para finalizar una rama release
release_finish() {
  check_git_repo
  check_branches
  
  if [ -z "$1" ]; then
    echo -e "${RED}Error: Debes proporcionar el número de versión de la rama release a finalizar.${NC}"
    echo "Uso: ./git-flow-helper.sh release finish <versión>"
    exit 1
  fi
  
  version=$1
  branch_name="release/$version"
  
  # Verificar si la rama existe
  if ! git show-ref --verify --quiet refs/heads/$branch_name; then
    echo -e "${RED}Error: La rama $branch_name no existe.${NC}"
    exit 1
  fi
  
  # Finalizar la rama release
  git checkout $branch_name
  git pull
  
  # Fusionar a main
  echo -e "${YELLOW}¿Quieres fusionar la rama $branch_name a main? (s/n)${NC}"
  read merge_main_answer
  if [ "$merge_main_answer" = "s" ]; then
    git checkout main
    git pull
    git merge --no-ff $branch_name -m "Merge release '$version' into main"
    git tag -a "v$version" -m "Versión $version"
    git push origin main --tags
    echo -e "${GREEN}Rama $branch_name fusionada con main, etiquetada como v$version y enviada al remoto.${NC}"
  else
    echo -e "${YELLOW}No se fusionó a main.${NC}"
  fi
  
  # Fusionar a develop
  echo -e "${YELLOW}¿Quieres fusionar la rama $branch_name a develop? (s/n)${NC}"
  read merge_develop_answer
  if [ "$merge_develop_answer" = "s" ]; then
    git checkout develop
    git pull
    git merge --no-ff $branch_name -m "Merge release '$version' into develop"
    git push origin develop
    echo -e "${GREEN}Rama $branch_name fusionada con develop y enviada al remoto.${NC}"
  else
    echo -e "${YELLOW}No se fusionó a develop.${NC}"
  fi
  
  # Eliminar rama release
  echo -e "${YELLOW}¿Quieres eliminar la rama $branch_name? (s/n)${NC}"
  read delete_answer
  if [ "$delete_answer" = "s" ]; then
    git branch -d $branch_name
    echo -e "${GREEN}Rama $branch_name eliminada localmente.${NC}"
    
    echo -e "${YELLOW}¿Quieres eliminar la rama $branch_name del remoto? (s/n)${NC}"
    read delete_remote_answer
    if [ "$delete_remote_answer" = "s" ]; then
      git push origin --delete $branch_name
      echo -e "${GREEN}Rama $branch_name eliminada del remoto.${NC}"
    fi
  fi
}

# Función para iniciar una rama hotfix
hotfix_start() {
  check_git_repo
  check_branches
  
  if [ -z "$1" ]; then
    echo -e "${RED}Error: Debes proporcionar un número de versión para la rama hotfix.${NC}"
    echo "Uso: ./git-flow-helper.sh hotfix start <versión>"
    exit 1
  fi
  
  version=$1
  branch_name="hotfix/$version"
  
  # Verificar si la rama ya existe
  if git show-ref --verify --quiet refs/heads/$branch_name; then
    echo -e "${RED}Error: La rama $branch_name ya existe.${NC}"
    exit 1
  fi
  
  # Crear la rama hotfix
  git checkout main
  git pull
  git checkout -b $branch_name
  
  echo -e "${GREEN}Rama $branch_name creada con éxito desde main.${NC}"
  echo -e "${YELLOW}Ahora puedes realizar correcciones urgentes.${NC}"
}

# Función para finalizar una rama hotfix
hotfix_finish() {
  check_git_repo
  check_branches
  
  if [ -z "$1" ]; then
    echo -e "${RED}Error: Debes proporcionar el número de versión de la rama hotfix a finalizar.${NC}"
    echo "Uso: ./git-flow-helper.sh hotfix finish <versión>"
    exit 1
  fi
  
  version=$1
  branch_name="hotfix/$version"
  
  # Verificar si la rama existe
  if ! git show-ref --verify --quiet refs/heads/$branch_name; then
    echo -e "${RED}Error: La rama $branch_name no existe.${NC}"
    exit 1
  fi
  
  # Finalizar la rama hotfix
  git checkout $branch_name
  git pull
  
  # Fusionar a main
  echo -e "${YELLOW}¿Quieres fusionar la rama $branch_name a main? (s/n)${NC}"
  read merge_main_answer
  if [ "$merge_main_answer" = "s" ]; then
    git checkout main
    git pull
    git merge --no-ff $branch_name -m "Merge hotfix '$version' into main"
    git tag -a "v$version" -m "Versión $version"
    git push origin main --tags
    echo -e "${GREEN}Rama $branch_name fusionada con main, etiquetada como v$version y enviada al remoto.${NC}"
  else
    echo -e "${YELLOW}No se fusionó a main.${NC}"
  fi
  
  # Fusionar a develop
  echo -e "${YELLOW}¿Quieres fusionar la rama $branch_name a develop? (s/n)${NC}"
  read merge_develop_answer
  if [ "$merge_develop_answer" = "s" ]; then
    git checkout develop
    git pull
    git merge --no-ff $branch_name -m "Merge hotfix '$version' into develop"
    git push origin develop
    echo -e "${GREEN}Rama $branch_name fusionada con develop y enviada al remoto.${NC}"
  else
    echo -e "${YELLOW}No se fusionó a develop.${NC}"
  fi
  
  # Eliminar rama hotfix
  echo -e "${YELLOW}¿Quieres eliminar la rama $branch_name? (s/n)${NC}"
  read delete_answer
  if [ "$delete_answer" = "s" ]; then
    git branch -d $branch_name
    echo -e "${GREEN}Rama $branch_name eliminada localmente.${NC}"
    
    echo -e "${YELLOW}¿Quieres eliminar la rama $branch_name del remoto? (s/n)${NC}"
    read delete_remote_answer
    if [ "$delete_remote_answer" = "s" ]; then
      git push origin --delete $branch_name
      echo -e "${GREEN}Rama $branch_name eliminada del remoto.${NC}"
    fi
  fi
}

# Verificar que estamos en un repositorio Git
check_git_repo

# Procesar comandos
case "$1" in
  feature)
    case "$2" in
      start)
        feature_start "$3"
        ;;
      finish)
        feature_finish "$3"
        ;;
      *)
        echo -e "${RED}Error: Comando feature inválido.${NC}"
        show_help
        exit 1
        ;;
    esac
    ;;
  release)
    case "$2" in
      start)
        release_start "$3"
        ;;
      finish)
        release_finish "$3"
        ;;
      *)
        echo -e "${RED}Error: Comando release inválido.${NC}"
        show_help
        exit 1
        ;;
    esac
    ;;
  hotfix)
    case "$2" in
      start)
        hotfix_start "$3"
        ;;
      finish)
        hotfix_finish "$3"
        ;;
      *)
        echo -e "${RED}Error: Comando hotfix inválido.${NC}"
        show_help
        exit 1
        ;;
    esac
    ;;
  status)
    show_status
    ;;
  help|--help|-h)
    show_help
    ;;
  *)
    echo -e "${RED}Error: Comando inválido.${NC}"
    show_help
    exit 1
    ;;
esac

exit 0