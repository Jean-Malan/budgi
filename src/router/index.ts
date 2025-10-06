import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
    },
    {
      path: '/budget',
      name: 'budget',
      component: () => import('../views/BudgetView.vue'),
    },
    {
      path: '/transactions',
      name: 'transactions',
      component: () => import('../views/TransactionsView.vue'),
    },
    {
      path: '/tags',
      name: 'tags',
      component: () => import('../views/TagsView.vue'),
    },
    {
      path: '/debts',
      name: 'debts',
      component: () => import('../views/DebtsView.vue'),
    },
    {
      path: '/bank-accounts',
      name: 'bank-accounts',
      component: () => import('../views/BankAccountsView.vue'),
    },
  ],
})

export default router
