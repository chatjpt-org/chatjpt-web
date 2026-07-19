import { defineStore } from 'pinia'
import { ref } from 'vue'

/** Estado de interface: sidebar e modal de configurações. */
export const useUiStore = defineStore('ui', () => {
  // Colapso em desktop (vira rail de ícones) e drawer em telas pequenas.
  const sidebarCollapsed = ref(false)
  const sidebarMobileOpen = ref(false)
  const settingsOpen = ref(false)
  const adminOpen = ref(false)

  function toggleSidebarCollapsed() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function openMobileSidebar() {
    sidebarMobileOpen.value = true
  }

  function closeMobileSidebar() {
    sidebarMobileOpen.value = false
  }

  return {
    sidebarCollapsed,
    sidebarMobileOpen,
    settingsOpen,
    adminOpen,
    toggleSidebarCollapsed,
    openMobileSidebar,
    closeMobileSidebar,
  }
})
