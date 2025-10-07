<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div class="flex items-center space-x-4">
        <h1 class="text-3xl font-bold text-gray-800">Transactions</h1>
        
        <!-- Date Range Picker -->
        <div class="flex items-center space-x-2">
          <el-date-picker
            v-model="localDateRange"
            type="daterange"
            range-separator="To"
            start-placeholder="Start date"
            end-placeholder="End date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="onDateRangeChange"
            @update:model-value="onDateRangeChange"
            @input="onDateRangeChange"
            class="w-80"
          />
          
          <button
            @click="dateRangeStore.goToCurrentMonth"
            class="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            This Month
          </button>
        </div>
      </div>
      
      <div class="flex space-x-3">
        <button
          @click="showPasteModal = true"
          class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          <span>Paste Excel Data</span>
        </button>
        <button
          @click="categorizeAllUncategorized"
          :disabled="budgetStore.uncategorizedTransactions.length === 0 || isProcessing"
          class="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isProcessing" class="flex items-center space-x-2">
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Processing...</span>
          </span>
          <span v-else>Auto-Categorize All</span>
        </button>
      </div>
    </div>

    <div v-if="!authStore.currentUser" class="text-center py-8">
      <p class="text-gray-600">Please select a user to view transactions.</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Smart Filters -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-800">Filters</h3>
          <button
            @click="resetFilters"
            class="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Reset All
          </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Search -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Search Description</label>
            <input
              v-model="filters.search"
              type="text"
              placeholder="Search transactions..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          
          <!-- Category Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <el-select
              v-model="filters.category"
              placeholder="All Categories"
              clearable
              filterable
              multiple
              collapse-tags
              collapse-tags-tooltip
              class="w-full filter-select"
              size="default"
            >
              <el-option label="Uncategorized" value="uncategorized" />
              <el-option
                v-for="category in budgetStore.categories"
                :key="category.id"
                :label="category.name"
                :value="category.id"
              />
            </el-select>
          </div>
          
          <!-- Transaction Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              v-model="filters.type"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="iou">IOUs</option>
            </select>
          </div>
          
          <!-- Amount Range -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Amount Range</label>
            <div class="flex space-x-2">
              <input
                v-model.number="filters.minAmount"
                type="number"
                step="0.01"
                placeholder="Min $"
                class="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <input
                v-model.number="filters.maxAmount"
                type="number"
                step="0.01"
                placeholder="Max $"
                class="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </div>
        
        <!-- Secondary Filters Row -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <!-- Bank Account Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Bank Account</label>
            <el-select
              v-model="filters.bankAccount"
              placeholder="All Accounts"
              clearable
              filterable
              class="w-full filter-select"
              size="default"
            >
              <el-option
                v-for="account in bankAccountStore.bankAccounts"
                :key="account.id"
                :label="account.name"
                :value="account.id"
              />
            </el-select>
          </div>
          
          <!-- Tag Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tag</label>
            <el-select
              v-model="filters.tag"
              placeholder="All Tags"
              clearable
              filterable
              class="w-full filter-select"
              size="default"
            >
              <el-option
                v-for="tag in budgetStore.transactionTags"
                :key="tag.id"
                :label="tag.name"
                :value="tag.id"
              />
            </el-select>
          </div>
          
          <!-- IOU Status Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">IOU Status</label>
            <select
              v-model="filters.iouStatus"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <!-- Highlighted Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Highlighted</label>
            <select
              v-model="filters.highlighted"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All Transactions</option>
              <option value="true">Highlighted Only</option>
              <option value="false">Not Highlighted</option>
            </select>
          </div>
          
          <!-- Sort By -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              v-model="filters.sortBy"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="date-desc">Date (Newest First)</option>
              <option value="date-asc">Date (Oldest First)</option>
              <option value="amount-desc">Amount (Highest First)</option>
              <option value="amount-asc">Amount (Lowest First)</option>
              <option value="description">Description (A-Z)</option>
            </select>
          </div>
        </div>
        
        <!-- Filter Summary -->
        <div v-if="activeFiltersCount > 0" class="mt-4 flex items-center space-x-2">
          <span class="text-sm text-gray-600">{{ filteredTransactions.length }} of {{ categorizedTransactions.length }} transactions</span>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="filter in activeFiltersList"
              :key="filter.key"
              class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
            >
              {{ filter.label }}
              <button
                @click="clearFilter(filter.key)"
                class="ml-1 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          </div>
        </div>
      </div>

      <!-- Uncategorized Transactions -->
      <div v-if="budgetStore.uncategorizedTransactions.length > 0" class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <div class="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center mr-2">
            <span class="text-white text-xs font-bold">{{ budgetStore.uncategorizedTransactions.length }}</span>
          </div>
          Uncategorized Transactions
        </h3>
        
        <div class="space-y-3">
          <div
            v-for="transaction in budgetStore.uncategorizedTransactions"
            :key="transaction.id"
            class="flex items-center justify-between p-4 border border-yellow-200 rounded-lg bg-yellow-50"
          >
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <h4 class="font-medium text-gray-800">{{ transaction.description }}</h4>
                <span class="text-lg font-bold text-red-600">-${{ transaction.amount.toFixed(2) }}</span>
              </div>
              <p class="text-sm text-gray-600">{{ formatDate(transaction.date) }}</p>
            </div>
            
            <div class="ml-4 flex items-center space-x-2">
              <el-select
                :model-value="selectedCategories[transaction.id] || ''"
                @update:model-value="updateSelectedCategory(transaction.id, $event)"
                placeholder="Select Category"
                clearable
                filterable
                size="small"
                style="width: 200px"
              >
                <el-option
                  v-for="category in budgetStore.categories"
                  :key="category.id"
                  :label="category.name"
                  :value="category.id"
                />
              </el-select>
              
              <button
                @click="categorizeTransaction(transaction.id, selectedCategories[transaction.id])"
                :disabled="!selectedCategories[transaction.id]"
                class="bg-green-600 text-white px-3 py-1 text-sm rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
              
              <button
                @click="autoCategorizeSingle(transaction)"
                :disabled="isProcessingSingle[transaction.id]"
                class="bg-purple-600 text-white px-3 py-1 text-sm rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <span v-if="isProcessingSingle[transaction.id]" class="flex items-center space-x-1">
                  <div class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>AI</span>
                </span>
                <span v-else>Auto</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- All Transactions -->
      <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-800">All Transactions</h3>
        </div>
        
        <div v-if="budgetStore.isLoading" class="text-center py-8">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        </div>
        
        <div v-else class="overflow-x-auto">
          <!-- Excel-style table -->
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IOU</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <!-- Always show empty row for adding transactions -->
              <tr class="bg-blue-50 border-2 border-blue-200">
                <td class="px-4 py-3">
                  <div class="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <span class="text-white text-xs">+</span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <input
                    v-model="transactionForm.date"
                    type="date"
                    class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </td>
                <td class="px-4 py-3">
                  <input
                    v-model="transactionForm.description"
                    type="text"
                    placeholder="Transaction description"
                    class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </td>
                <td class="px-4 py-3">
                  <el-select
                    v-model="transactionForm.category_id"
                    placeholder="Select Category"
                    clearable
                    filterable
                    size="small"
                    :disabled="transactionForm.is_income"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="category in budgetStore.categories"
                      :key="category.id"
                      :label="category.name"
                      :value="category.id"
                    />
                  </el-select>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center space-x-1">
                    <span class="text-sm text-gray-500">$</span>
                    <input
                      v-model.number="transactionForm.amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      class="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>
                </td>
                <td class="px-4 py-3">
                  <el-select
                    v-model="transactionForm.bank_account_id"
                    placeholder="Select Account"
                    clearable
                    filterable
                    size="small"
                    style="width: 100%"
                    required
                  >
                    <el-option
                      v-for="account in bankAccountStore.currentUserBankAccounts"
                      :key="account.id"
                      :label="account.name"
                      :value="account.id"
                    />
                  </el-select>
                </td>
                <td class="px-4 py-3 w-24">
                  <el-select
                    v-model="transactionForm.is_income"
                    size="small"
                    style="width: 100%"
                  >
                    <el-option label="Expense" :value="false" />
                    <el-option label="Income" :value="true" />
                  </el-select>
                </td>
                <td class="px-4 py-3 w-48">
                  <el-select
                    v-model="transactionForm.selectedTags"
                    placeholder="Tags"
                    multiple
                    clearable
                    filterable
                    size="small"
                    style="width: 100%"
                    collapse-tags
                    collapse-tags-tooltip
                  >
                    <el-option
                      v-for="tag in budgetStore.transactionTags"
                      :key="tag.id"
                      :label="tag.name"
                      :value="tag.id"
                    >
                      <div class="flex items-center">
                        <div
                          class="w-3 h-3 rounded-full mr-2"
                          :style="{ backgroundColor: tag.color }"
                        ></div>
                        {{ tag.name }}
                      </div>
                    </el-option>
                  </el-select>
                </td>
                <td class="px-4 py-3">
                  <div v-if="!transactionForm.is_income && (authStore.currentUser?.name === 'Jean' || authStore.currentUser?.name === 'Izzy')" class="space-y-1">
                    <label class="flex items-center text-xs">
                      <input
                        v-model="transactionForm.is_debt"
                        type="checkbox"
                        class="mr-1 text-blue-600 focus:ring-blue-500"
                      />
                      Mark as IOU
                    </label>
                    <div v-if="transactionForm.is_debt" class="space-y-1">
                      <el-select
                        v-model="transactionForm.debt_debtor"
                        placeholder="Who owes?"
                        clearable
                        filterable
                        size="small"
                        style="width: 100%"
                        required
                      >
                        <el-option label="Jean" value="Jean" />
                        <el-option label="Izzy" value="Izzy" />
                      </el-select>
                      <input
                        v-model.number="transactionForm.debt_split_percentage"
                        type="number"
                        min="1"
                        max="100"
                        placeholder="% split"
                        class="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <!-- Payback Fields -->
                    <div v-if="!transactionForm.is_debt" class="space-y-1 mt-2">
                      <label class="flex items-center text-xs">
                        <input
                          v-model="transactionForm.is_payback"
                          type="checkbox"
                          class="mr-1 text-green-600 focus:ring-green-500"
                        />
                        This is a payback
                      </label>
                      <div v-if="transactionForm.is_payback" class="space-y-1">
                        <el-select
                          v-model="transactionForm.payback_from_user"
                          placeholder="Who is paying you back?"
                          clearable
                          filterable
                          size="small"
                          style="width: 100%"
                          required
                        >
                          <el-option 
                            v-for="user in availablePaybackUsers" 
                            :key="user"
                            :label="user" 
                            :value="user" 
                          />
                        </el-select>
                      </div>
                    </div>
                  </div>
                  <span v-else class="text-xs text-gray-400">-</span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex space-x-1">
                    <button
                      @click="addTransaction"
                      :disabled="!transactionForm.description || transactionForm.amount <= 0 || !transactionForm.bank_account_id || (transactionForm.is_debt && (!transactionForm.debt_debtor || !transactionForm.debt_split_percentage)) || (transactionForm.is_payback && !transactionForm.payback_from_user)"
                      class="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Save transaction"
                    >
                      ✓
                    </button>
                    <button
                      @click="cancelAddTransaction"
                      class="px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500"
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
              
              <!-- Existing transactions -->
              <tr
                v-for="transaction in filteredTransactions"
                :key="transaction.id"
                class="hover:bg-gray-50"
                :class="{
                  'border-l-4 border-blue-400 bg-blue-50': transaction.is_payback && !transaction.is_highlighted,
                  'border-l-4 border-orange-400 bg-orange-50': transaction.is_debt && transaction.debt_status === 'active' && !transaction.is_highlighted,
                  'border-l-4 border-green-400 bg-green-50': transaction.is_debt && transaction.debt_status === 'paid' && !transaction.is_highlighted,
                  'border-l-4 border-yellow-400 bg-yellow-50': transaction.is_highlighted
                }"
              >
                <td class="px-4 py-3">
                  <div
                    v-if="transaction.category"
                    class="w-4 h-4 rounded-full"
                    :style="{ backgroundColor: transaction.category.color }"
                  ></div>
                  <div class="w-4 h-4 bg-gray-300 rounded-full" v-else></div>
                </td>
                <!-- Editable Date -->
                <td class="px-4 py-3">
                  <input
                    :value="transaction.date"
                    @change="updateTransaction(transaction.id, 'date', ($event.target as HTMLInputElement).value)"
                    type="date"
                    class="w-full px-2 py-1 text-sm border border-transparent rounded hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-transparent transition-all duration-200"
                    :class="getUpdateClass(transaction.id, 'date')"
                  />
                </td>
                <!-- Editable Description -->
                <td class="px-4 py-3">
                  <input
                    :value="transaction.description"
                    @change="updateTransaction(transaction.id, 'description', ($event.target as HTMLInputElement).value)"
                    type="text"
                    class="w-full px-2 py-1 text-sm border border-transparent rounded hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-transparent font-medium transition-all duration-200"
                    :class="getUpdateClass(transaction.id, 'description')"
                  />
                  <div v-if="transaction.confidence_score" class="text-xs text-gray-500 mt-1">
                    {{ Math.round(transaction.confidence_score * 100) }}% confidence
                  </div>
                </td>
                <!-- Editable Category -->
                <td class="px-4 py-3">
                  <div class="flex items-center space-x-1">
                    <el-select
                      :model-value="transaction.category_id || ''"
                      @update:model-value="updateTransaction(transaction.id, 'category_id', $event)"
                      placeholder="Category"
                      clearable
                      filterable
                      size="small"
                      :class="getUpdateClass(transaction.id, 'category_id')"
                      style="flex: 1"
                    >
                      <el-option
                        v-for="category in budgetStore.categories"
                        :key="category.id"
                        :label="category.name"
                        :value="category.id"
                      />
                    </el-select>
                    <button
                      v-if="transaction.category_id"
                      @click="openApplyToAllModal(transaction.category_id)"
                      class="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      title="Apply this category to all visible transactions"
                    >
                      <svg class="w-4 h-4 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                      </svg>
                    </button>
                  </div>
                </td>
                <!-- Editable Amount -->
                <td class="px-4 py-3">
                  <div class="flex items-center">
                    <span class="text-sm mr-1" :class="transaction.is_payback ? 'text-blue-600' : transaction.is_income ? 'text-green-600' : 'text-red-600'">
                      {{ transaction.is_payback ? '↩' : transaction.is_income ? '+' : '-' }}$
                    </span>
                    <input
                      :value="transaction.amount"
                      @change="updateTransaction(transaction.id, 'amount', parseFloat(($event.target as HTMLInputElement).value))"
                      type="number"
                      step="0.01"
                      min="0"
                      class="w-20 px-2 py-1 text-sm border border-transparent rounded hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-transparent font-semibold transition-all duration-200"
                      :class="[transaction.is_payback ? 'text-blue-600' : transaction.is_income ? 'text-green-600' : 'text-red-600', getUpdateClass(transaction.id, 'amount')]"
                    />
                  </div>
                </td>
                <!-- Editable Bank Account -->
                <td class="px-4 py-3">
                  <el-select
                    :model-value="transaction.bank_account_id || ''"
                    @update:model-value="updateTransaction(transaction.id, 'bank_account_id', $event)"
                    placeholder="Account"
                    clearable
                    filterable
                    size="small"
                    :class="getUpdateClass(transaction.id, 'bank_account_id')"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="account in bankAccountStore.bankAccounts"
                      :key="account.id"
                      :label="account.name"
                      :value="account.id"
                    />
                  </el-select>
                </td>
                <!-- Editable Type -->
                <td class="px-4 py-3 w-24">
                  <el-select
                    :model-value="transaction.is_income"
                    @update:model-value="updateTransaction(transaction.id, 'is_income', $event)"
                    size="small"
                    :class="getUpdateClass(transaction.id, 'is_income')"
                    style="width: 100%"
                  >
                    <el-option label="Expense" :value="false" />
                    <el-option label="Income" :value="true" />
                  </el-select>
                </td>
                <!-- Editable Tags Column -->
                <td class="px-4 py-3 w-48">
                  <el-select
                    :model-value="getTagsForTransaction(transaction.id).map(t => t.id)"
                    @update:model-value="updateTransactionTags(transaction.id, $event)"
                    placeholder="Tags"
                    multiple
                    clearable
                    filterable
                    size="small"
                    :class="getUpdateClass(transaction.id, 'tags')"
                    style="width: 100%"
                    collapse-tags
                    collapse-tags-tooltip
                  >
                    <el-option
                      v-for="tag in budgetStore.transactionTags"
                      :key="tag.id"
                      :label="tag.name"
                      :value="tag.id"
                    >
                      <div class="flex items-center">
                        <div
                          class="w-3 h-3 rounded-full mr-2"
                          :style="{ backgroundColor: tag.color }"
                        ></div>
                        {{ tag.name }}
                      </div>
                    </el-option>
                  </el-select>
                </td>
                <td class="px-4 py-3">
                  <div v-if="transaction.is_debt" class="space-y-1">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full"
                          :class="transaction.debt_status === 'active' ? 'bg-orange-100 text-orange-800' : 
                                 transaction.debt_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
                      {{ transaction.debt_status === 'active' ? 'Active' : 
                         transaction.debt_status === 'paid' ? 'Paid' : 'Cancelled' }}
                    </span>
                    <div class="text-xs text-gray-500">
                      {{ getDebtorName(transaction.debt_debtor_id) }} owes {{ transaction.debt_split_percentage }}%
                    </div>
                  </div>
                  <div v-else-if="transaction.is_payback" class="space-y-1">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 flex items-center">
                      <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Payback
                    </span>
                    <div class="text-xs text-gray-500">
                      {{ getUserNameFromId(transaction.payback_from_user_id) }} paid back
                    </div>
                  </div>
                  <span v-else class="text-xs text-gray-400">-</span>
                </td>
                <td class="px-4 py-3">
                  <el-dropdown trigger="click">
                    <button class="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center space-x-1">
                      <span>Actions</span>
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    </button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <!-- Note -->
                        <el-dropdown-item @click="openNotesModal(transaction)">
                          <div class="flex items-center space-x-2">
                            <svg class="w-4 h-4" :class="transaction.notes ? 'text-blue-600' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                            </svg>
                            <span>{{ transaction.notes ? 'Edit Note' : 'Add Note' }}</span>
                          </div>
                        </el-dropdown-item>

                        <!-- Highlight -->
                        <el-dropdown-item @click="budgetStore.toggleTransactionHighlight(transaction.id)">
                          <div class="flex items-center space-x-2">
                            <svg class="w-4 h-4" :class="transaction.is_highlighted ? 'text-yellow-500' : 'text-gray-400'" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
                            </svg>
                            <span>{{ transaction.is_highlighted ? 'Remove Highlight' : 'Highlight' }}</span>
                          </div>
                        </el-dropdown-item>

                        <!-- IOU Options - only for non-income and Jean/Izzy -->
                        <template v-if="!transaction.is_income && (authStore.currentUser?.name === 'Jean' || authStore.currentUser?.name === 'Izzy')">
                          <el-dropdown-item v-if="!transaction.is_debt && !transaction.is_payback" divided @click="openIOUModal(transaction)">
                            <div class="flex items-center space-x-2">
                              <svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                              </svg>
                              <span>Mark as IOU</span>
                            </div>
                          </el-dropdown-item>

                          <el-dropdown-item v-if="!transaction.is_debt && !transaction.is_payback" @click="openMarkAsPaybackModal(transaction)">
                            <div class="flex items-center space-x-2">
                              <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                              <span>Mark as Payback</span>
                            </div>
                          </el-dropdown-item>

                          <el-dropdown-item v-if="transaction.is_debt && transaction.debt_status === 'active'" divided @click="openPaymentModal(transaction)">
                            <div class="flex items-center space-x-2">
                              <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                              <span>Make Payment</span>
                            </div>
                          </el-dropdown-item>

                          <el-dropdown-item v-if="transaction.is_debt" @click="unmarkAsIOU(transaction)">
                            <div class="flex items-center space-x-2">
                              <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                              </svg>
                              <span>Unmark IOU</span>
                            </div>
                          </el-dropdown-item>
                        </template>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </td>
              </tr>
              
              <!-- Empty state message -->
              <tr v-if="filteredTransactions.length === 0 && budgetStore.transactions.length > 0">
                <td colspan="10" class="px-4 py-8 text-center text-gray-500">
                  No transactions match your current filters. Try adjusting your filter criteria.
                </td>
              </tr>
              <tr v-else-if="budgetStore.transactions.length === 0">
                <td colspan="10" class="px-4 py-8 text-center text-gray-500">
                  No transactions found for this period. Use the form above to add your first transaction.
                </td>
              </tr>
            </tbody>
          </table>
          
          <!-- Totals Summary -->
          <div v-if="filteredTransactions.length > 0" class="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div class="text-center">
                <div class="font-medium text-gray-700">Total Transactions</div>
                <div class="text-lg font-bold text-gray-900">{{ filteredTransactions.length }}</div>
              </div>
              <div class="text-center">
                <div class="font-medium text-gray-700">Total Income</div>
                <div class="text-lg font-bold text-green-600">+${{ totalIncome.toFixed(2) }}</div>
              </div>
              <div class="text-center">
                <div class="font-medium text-gray-700">Total Expenses</div>
                <div class="text-lg font-bold text-red-600">-${{ totalExpenses.toFixed(2) }}</div>
              </div>
              <div class="text-center">
                <div class="font-medium text-gray-700">Net Amount</div>
                <div class="text-lg font-bold" :class="netAmount >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ netAmount >= 0 ? '+' : '' }}${{ netAmount.toFixed(2) }}
                </div>
              </div>
            </div>
            
            <!-- IOU Summary if any IOUs are present -->
            <div v-if="totalActiveIOUs > 0 || totalPaidIOUs > 0" class="mt-4 pt-4 border-t border-gray-300">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div class="text-center">
                  <div class="font-medium text-gray-700">Active IOUs</div>
                  <div class="text-lg font-bold text-orange-600">${{ totalActiveIOUs.toFixed(2) }}</div>
                </div>
                <div class="text-center">
                  <div class="font-medium text-gray-700">Paid IOUs</div>
                  <div class="text-lg font-bold text-green-600">${{ totalPaidIOUs.toFixed(2) }}</div>
                </div>
                <div class="text-center">
                  <div class="font-medium text-gray-700">Outstanding Debt</div>
                  <div class="text-lg font-bold text-red-600">${{ totalOutstandingDebt.toFixed(2) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- Mark as IOU Modal -->
    <div v-if="showIOUModal && selectedTransaction" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-8 w-full max-w-md mx-4 shadow-2xl">
        <div class="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        
        <h3 class="text-xl font-semibold text-gray-900 text-center mb-2">Mark as IOU</h3>
        <p class="text-sm text-gray-500 text-center mb-6">
          Mark this ${{ selectedTransaction.amount.toFixed(2) }} expense as an IOU
        </p>
        
        <form @submit.prevent="markAsIOU" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Who owes money?</label>
            <el-select
              v-model="iouForm.debtor"
              placeholder="Select who owes money"
              clearable
              filterable
              style="width: 100%"
              required
            >
              <el-option label="Jean" value="Jean" />
              <el-option label="Izzy" value="Izzy" />
            </el-select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Split Percentage</label>
            <div class="relative">
              <input
                v-model.number="iouForm.splitPercentage"
                type="number"
                min="1"
                max="100"
                step="1"
                required
                class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">%</span>
            </div>
            <p class="text-sm text-gray-500 mt-1">
              {{ iouForm.debtor }} will owe ${{ ((selectedTransaction.amount * iouForm.splitPercentage) / 100).toFixed(2) }}
            </p>
          </div>
          
          <div class="flex space-x-3 pt-4">
            <button
              type="button"
              @click="cancelIOU"
              class="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Mark as IOU
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Mark as Payback Modal -->
    <div v-if="showMarkAsPaybackModal && selectedTransaction" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-8 w-full max-w-md mx-4 shadow-2xl">
        <div class="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full">
          <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>

        <h3 class="text-xl font-semibold text-gray-900 text-center mb-2">Mark as Payback</h3>
        <p class="text-sm text-gray-500 text-center mb-6">
          Mark this ${{ selectedTransaction.amount.toFixed(2) }} expense as a payback
        </p>

        <form @submit.prevent="markAsPayback" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Who is paying you back?</label>
            <el-select
              v-model="paybackForm.paybackFromUser"
              placeholder="Select who is paying back"
              clearable
              filterable
              style="width: 100%"
              required
            >
              <el-option
                v-for="user in availablePaybackUsers"
                :key="user"
                :label="user"
                :value="user"
              />
            </el-select>
          </div>

          <div class="flex space-x-3 pt-4">
            <button
              type="button"
              @click="cancelMarkAsPayback"
              class="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Mark as Payback
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Payment Modal -->
    <div v-if="showPaymentModal && selectedTransaction" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-8 w-full max-w-md mx-4 shadow-2xl">
        <h3 class="text-xl font-semibold text-gray-900 text-center mb-2">Make Payment</h3>
        <p class="text-sm text-gray-500 text-center mb-6">
          Pay towards: {{ selectedTransaction.description }}
        </p>
        
        <form @submit.prevent="makePayment" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Payment Amount</label>
            <div class="relative">
              <input
                v-model.number="paymentForm.amount"
                type="number"
                step="0.01"
                min="0.01"
                :max="selectedTransaction.debt_remaining_amount"
                required
                class="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
              <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
            </div>
            <p class="text-sm text-gray-500 mt-1">
              Remaining debt: ${{ selectedTransaction.debt_remaining_amount?.toFixed(2) }}
            </p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Payment Method (Optional)</label>
            <input
              v-model="paymentForm.paymentMethod"
              type="text"
              class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Cash, Bank Transfer, PayPal"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              v-model="paymentForm.notes"
              rows="3"
              class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any additional notes..."
            ></textarea>
          </div>
          
          <div class="flex space-x-3 pt-4">
            <button
              type="button"
              @click="cancelPayment"
              class="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Tag Assignment Modal -->
    <div v-if="showTagModal && selectedTransaction" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-8 w-full max-w-md mx-4 shadow-2xl">
        <h3 class="text-xl font-semibold text-gray-900 text-center mb-2">Manage Tags</h3>
        <p class="text-sm text-gray-500 text-center mb-6">
          Add or remove tags for: {{ selectedTransaction.description }}
        </p>
        
        <div class="space-y-4">
          <!-- Current Tags -->
          <div v-if="getTagsForTransaction(selectedTransaction.id).length > 0">
            <h4 class="text-sm font-medium text-gray-700 mb-2">Current Tags</h4>
            <div class="flex flex-wrap gap-2 mb-4">
              <span
                v-for="tag in getTagsForTransaction(selectedTransaction.id)"
                :key="tag.id"
                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                :style="{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color }"
                style="border-width: 1px;"
              >
                {{ tag.name }}
                <button
                  @click="removeTagFromTransaction(selectedTransaction.id, tag.id)"
                  class="ml-2 text-current hover:text-red-600 font-bold"
                >
                  ×
                </button>
              </span>
            </div>
          </div>
          
          <!-- Add New Tag -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-2">Add Tag</h4>
            <el-select
              v-model="selectedTagToAdd"
              placeholder="Select a tag to add"
              clearable
              filterable
              style="width: 100%"
            >
              <el-option
                v-for="tag in availableTagsForTransaction"
                :key="tag.id"
                :label="tag.name"
                :value="tag.id"
              >
                <div class="flex items-center">
                  <div
                    class="w-3 h-3 rounded-full mr-2"
                    :style="{ backgroundColor: tag.color }"
                  ></div>
                  {{ tag.name }}
                </div>
              </el-option>
            </el-select>
            
            <button
              v-if="selectedTagToAdd"
              @click="addSelectedTag"
              class="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Tag
            </button>
          </div>
          
          <!-- Quick Actions -->
          <div class="pt-4 border-t border-gray-200">
            <button
              @click="closeTagModal"
              class="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Paste Transactions Modal -->
  <PasteTransactionsModal
    :is-open="showPasteModal"
    @close="showPasteModal = false"
    @saved="handleTransactionsSaved"
  />

  <!-- Notes Modal -->
  <div v-if="showNotesModal && selectedTransaction" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl p-8 w-full max-w-md mx-4 shadow-2xl">
      <div class="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full">
        <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
        </svg>
      </div>

      <h3 class="text-xl font-semibold text-gray-900 text-center mb-2">Transaction Note</h3>
      <p class="text-sm text-gray-500 text-center mb-6">
        {{ selectedTransaction.description }}
      </p>

      <form @submit.prevent="saveNote" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Note</label>
          <textarea
            v-model="noteText"
            rows="4"
            class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Add notes or comments about this transaction..."
          ></textarea>
        </div>

        <div class="flex space-x-3 pt-4">
          <button
            type="button"
            @click="closeNotesModal"
            class="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isSavingNote"
            class="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isSavingNote" class="flex items-center justify-center space-x-2">
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </span>
            <span v-else>Save Note</span>
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Apply Category to All Modal -->
  <div v-if="showApplyToAllModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl p-8 w-full max-w-md mx-4 shadow-2xl">
      <div v-if="!applyToAllSuccess" class="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-indigo-100 rounded-full">
        <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
        </svg>
      </div>
      <div v-else class="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full">
        <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>

      <div v-if="!applyToAllSuccess">
        <h3 class="text-xl font-semibold text-gray-900 text-center mb-2">Apply Category to All</h3>
        <p class="text-sm text-gray-500 text-center mb-6">
          Are you sure you want to apply the category <strong>{{ getCategoryName(selectedCategoryForApplyAll) }}</strong> to all <strong>{{ filteredTransactions.length }} visible transactions</strong>?
        </p>
        <p class="text-xs text-gray-400 text-center mb-6">
          This will only affect the transactions currently displayed on the screen based on your active filters.
        </p>

        <div class="flex space-x-3">
          <button
            type="button"
            @click="closeApplyToAllModal"
            class="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            @click="applyToAllTransactions"
            :disabled="isApplyingToAll"
            class="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isApplyingToAll" class="flex items-center justify-center space-x-2">
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Applying...</span>
            </span>
            <span v-else>Apply to All</span>
          </button>
        </div>
      </div>

      <div v-else>
        <h3 class="text-xl font-semibold text-gray-900 text-center mb-2">Success!</h3>
        <p class="text-sm text-gray-500 text-center mb-6">
          Successfully applied <strong>{{ getCategoryName(selectedCategoryForApplyAll) }}</strong> to <strong>{{ appliedCount }} transactions</strong>.
        </p>
        <button
          @click="closeApplyToAllModal"
          class="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          Done
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useBudgetStore } from '@/stores/budget'
import { useDebtStore } from '@/stores/debt'
import { useBankAccountStore } from '@/stores/bankAccount'
import { useDateRangeStore } from '@/stores/dateRange'
import { categorizeTransactionWithAI } from '@/lib/openai'
import { supabase } from '@/lib/supabase'
import PasteTransactionsModal from '@/components/PasteTransactionsModal.vue'
import { ElDatePicker } from 'element-plus'

const route = useRoute()
const authStore = useAuthStore()
const budgetStore = useBudgetStore()
const debtStore = useDebtStore()
const bankAccountStore = useBankAccountStore()
const dateRangeStore = useDateRangeStore()

const showAddTransaction = ref(false)
const showIOUModal = ref(false)
const showPaymentModal = ref(false)
const showMarkAsPaybackModal = ref(false)
const showTagModal = ref(false)
const showPasteModal = ref(false)
const showApplyToAllModal = ref(false)
const showNotesModal = ref(false)
const applyToAllSuccess = ref(false)
const appliedCount = ref(0)
const isProcessing = ref(false)
const isProcessingSingle = reactive<Record<string, boolean>>({})
const isApplyingToAll = ref(false)
const isSavingNote = ref(false)
const selectedCategories = reactive<Record<string, string>>({})
const selectedTransaction = ref<any>(null)
const selectedCategoryForApplyAll = ref<string>('')
const noteText = ref('')

const transactionForm = ref({
  description: '',
  amount: 0,
  date: new Date().toISOString().split('T')[0],
  is_income: false,
  category_id: '',
  bank_account_id: '',
  selectedTags: [] as string[],
  is_debt: false,
  debt_debtor: '',
  debt_split_percentage: 50,
  is_payback: false,
  payback_from_user: ''
})

const iouForm = ref({
  debtor: '',
  splitPercentage: 50
})

const paymentForm = ref({
  amount: 0,
  paymentMethod: '',
  notes: ''
})

const paybackForm = ref({
  paybackFromUser: ''
})

const selectedTagToAdd = ref('')

// Smart filtering state
const filters = ref({
  search: '',
  category: [] as string[],
  type: '',
  minAmount: null as number | null,
  maxAmount: null as number | null,
  bankAccount: '',
  tag: '',
  iouStatus: '',
  highlighted: '',
  sortBy: 'date-desc'
})

const categorizedTransactions = computed(() => {
  return budgetStore.transactions.map(transaction => {
    const category = budgetStore.categories.find(c => c.id === transaction.category_id)
    return {
      ...transaction,
      category
    }
  })
})

const filteredTransactions = computed(() => {
  let filtered = [...categorizedTransactions.value]

  // Search filter
  if (filters.value.search) {
    const searchTerm = filters.value.search.toLowerCase()
    filtered = filtered.filter(t => 
      t.description.toLowerCase().includes(searchTerm)
    )
  }

  // Category filter
  if (filters.value.category.length > 0) {
    filtered = filtered.filter(t => {
      if (filters.value.category.includes('uncategorized') && !t.category_id) {
        return true
      }
      return t.category_id && filters.value.category.includes(t.category_id)
    })
  }

  // Type filter
  if (filters.value.type) {
    if (filters.value.type === 'income') {
      filtered = filtered.filter(t => t.is_income)
    } else if (filters.value.type === 'expense') {
      filtered = filtered.filter(t => !t.is_income && !t.is_debt)
    } else if (filters.value.type === 'iou') {
      filtered = filtered.filter(t => t.is_debt)
    }
  }

  // Amount range filter
  if (filters.value.minAmount !== null) {
    filtered = filtered.filter(t => t.amount >= filters.value.minAmount!)
  }
  if (filters.value.maxAmount !== null) {
    filtered = filtered.filter(t => t.amount <= filters.value.maxAmount!)
  }

  // Bank account filter
  if (filters.value.bankAccount) {
    filtered = filtered.filter(t => t.bank_account_id === filters.value.bankAccount)
  }

  // Tag filter
  if (filters.value.tag) {
    const tagTransactionIds = budgetStore.tagAssignments
      .filter(ta => ta.tag_id === filters.value.tag)
      .map(ta => ta.transaction_id)
    filtered = filtered.filter(t => tagTransactionIds.includes(t.id))
  }

  // IOU status filter
  if (filters.value.iouStatus) {
    filtered = filtered.filter(t => t.debt_status === filters.value.iouStatus)
  }

  // Highlight filter
  if (filters.value.highlighted) {
    if (filters.value.highlighted === 'true') {
      const highlightedTransactions = filtered.filter(t => t.is_highlighted)
      console.log('Filtering for highlighted transactions:', highlightedTransactions.length, 'out of', filtered.length)
      console.log('Sample highlighted transactions:', highlightedTransactions.slice(0, 3).map(t => ({id: t.id, description: t.description, is_highlighted: t.is_highlighted})))
      filtered = highlightedTransactions
    } else if (filters.value.highlighted === 'false') {
      filtered = filtered.filter(t => !t.is_highlighted)
    }
  }

  // Sorting
  filtered.sort((a, b) => {
    switch (filters.value.sortBy) {
      case 'date-desc':
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      case 'date-asc':
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      case 'amount-desc':
        return b.amount - a.amount
      case 'amount-asc':
        return a.amount - b.amount
      case 'description':
        return a.description.localeCompare(b.description)
      default:
        return 0
    }
  })

  return filtered
})

// Filter management
const activeFiltersCount = computed(() => {
  let count = 0
  if (filters.value.search) count++
  if (filters.value.category.length > 0) count++
  if (filters.value.type) count++
  if (filters.value.minAmount !== null) count++
  if (filters.value.maxAmount !== null) count++
  if (filters.value.bankAccount) count++
  if (filters.value.tag) count++
  if (filters.value.iouStatus) count++
  if (filters.value.highlighted) count++
  return count
})

const activeFiltersList = computed(() => {
  const active = []

  if (filters.value.search) {
    active.push({ key: 'search', label: `Search: "${filters.value.search}"` })
  }
  if (filters.value.category.length > 0) {
    const categoryNames = filters.value.category.map(catId => {
      if (catId === 'uncategorized') return 'Uncategorized'
      return budgetStore.categories.find(c => c.id === catId)?.name || 'Unknown'
    }).join(', ')
    active.push({ key: 'category', label: `Categories: ${categoryNames}` })
  }
  if (filters.value.type) {
    const typeLabel = filters.value.type === 'income' ? 'Income' : 
                     filters.value.type === 'expense' ? 'Expense' : 'IOUs'
    active.push({ key: 'type', label: `Type: ${typeLabel}` })
  }
  if (filters.value.minAmount !== null) {
    active.push({ key: 'minAmount', label: `Min: $${filters.value.minAmount}` })
  }
  if (filters.value.maxAmount !== null) {
    active.push({ key: 'maxAmount', label: `Max: $${filters.value.maxAmount}` })
  }
  if (filters.value.bankAccount) {
    const accountName = bankAccountStore.bankAccounts.find(a => a.id === filters.value.bankAccount)?.name || 'Unknown'
    active.push({ key: 'bankAccount', label: `Account: ${accountName}` })
  }
  if (filters.value.tag) {
    const tagName = budgetStore.transactionTags.find(t => t.id === filters.value.tag)?.name || 'Unknown'
    active.push({ key: 'tag', label: `Tag: ${tagName}` })
  }
  if (filters.value.iouStatus) {
    const statusLabel = filters.value.iouStatus === 'active' ? 'Active' :
                       filters.value.iouStatus === 'paid' ? 'Paid' : 'Cancelled'
    active.push({ key: 'iouStatus', label: `IOU: ${statusLabel}` })
  }
  if (filters.value.highlighted) {
    const highlightLabel = filters.value.highlighted === 'true' ? 'Highlighted Only' : 'Not Highlighted'
    active.push({ key: 'highlighted', label: `Filter: ${highlightLabel}` })
  }
  
  return active
})

const availableTagsForTransaction = computed(() => {
  if (!selectedTransaction.value) return []
  
  const currentTagIds = getTagsForTransaction(selectedTransaction.value.id).map(t => t.id)
  return budgetStore.transactionTags.filter(tag => !currentTagIds.includes(tag.id))
})

const resetFilters = () => {
  filters.value = {
    search: '',
    category: [],
    type: '',
    minAmount: null,
    maxAmount: null,
    bankAccount: '',
    tag: '',
    iouStatus: '',
    highlighted: '',
    sortBy: 'date-desc'
  }
}

const clearFilter = (filterKey: string) => {
  switch (filterKey) {
    case 'search':
      filters.value.search = ''
      break
    case 'category':
      filters.value.category = []
      break
    case 'type':
      filters.value.type = ''
      break
    case 'minAmount':
      filters.value.minAmount = null
      break
    case 'maxAmount':
      filters.value.maxAmount = null
      break
    case 'bankAccount':
      filters.value.bankAccount = ''
      break
    case 'tag':
      filters.value.tag = ''
      break
    case 'iouStatus':
      filters.value.iouStatus = ''
      break
    case 'highlighted':
      filters.value.highlighted = ''
      break
  }
}

// Totals calculations based on filtered transactions
const totalIncome = computed(() => {
  const incomeTransactions = filteredTransactions.value.filter(t => t.is_income)
  const total = incomeTransactions.reduce((sum, t) => sum + t.amount, 0)
  console.log('Income transactions:', incomeTransactions.length, 'Total:', total)
  return total
})

const totalExpenses = computed(() => {
  const expenseTransactions = filteredTransactions.value.filter(t => !t.is_income)
  const total = expenseTransactions.reduce((sum, t) => sum + t.amount, 0)
  console.log('Expense transactions:', expenseTransactions.length, 'Total:', total)
  return total
})

const netAmount = computed(() => {
  const net = totalIncome.value - totalExpenses.value
  console.log('Net calculation:', totalIncome.value, '-', totalExpenses.value, '=', net)
  return net
})

const totalActiveIOUs = computed(() => {
  return filteredTransactions.value
    .filter(t => t.is_debt && t.debt_status === 'active')
    .reduce((sum, t) => sum + t.amount, 0)
})

const totalPaidIOUs = computed(() => {
  return filteredTransactions.value
    .filter(t => t.is_debt && t.debt_status === 'paid')
    .reduce((sum, t) => sum + t.amount, 0)
})

const totalOutstandingDebt = computed(() => {
  return filteredTransactions.value
    .filter(t => t.is_debt && t.debt_status === 'active')
    .reduce((sum, t) => sum + (t.debt_remaining_amount || 0), 0)
})

// Available users for payback (exclude current user)
const availablePaybackUsers = computed(() => {
  const currentUserName = authStore.currentUser?.name
  const allUsers = ['Jean', 'Izzy', 'Shared']
  return allUsers.filter(user => user !== currentUserName)
})

// Local computed for date range to ensure reactivity
const localDateRange = computed({
  get: () => {
    console.log('Getting dateRange from store:', dateRangeStore.dateRange)
    return dateRangeStore.dateRange
  },
  set: async (value) => {
    console.log('Setting dateRange via computed setter:', value)
    if (value && Array.isArray(value) && value.length === 2) {
      dateRangeStore.setDateRange(value as [string, string])
      await loadData()
    } else if (value === null) {
      dateRangeStore.setDateRange(null)
      await loadData()
    }
  }
})

const onDateRangeChange = async (range: [string, string] | null) => {
  console.log('Date range changed:', range)
  dateRangeStore.setDateRange(range)
  // Immediately reload data when date range changes
  await loadData()
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getDebtorName = (userId: string | null) => {
  if (!userId) return 'Unknown'
  
  // Simple hardcoded mapping for now - could be improved with a user store
  const currentUserId = authStore.currentUser?.id
  if (userId === currentUserId) return authStore.currentUser?.name || 'Unknown'
  
  // For the other user, we know it's either Jean or Izzy
  if (authStore.currentUser?.name === 'Jean') return 'Izzy'
  if (authStore.currentUser?.name === 'Izzy') return 'Jean'
  
  return 'Unknown'
}

const getUserNameFromId = (userId: string | null) => {
  if (!userId) return 'Unknown'
  
  // Simple hardcoded mapping for now - could be improved with a user store
  const currentUserId = authStore.currentUser?.id
  if (userId === currentUserId) return authStore.currentUser?.name || 'Unknown'
  
  // For the other user, we know it's either Jean or Izzy
  if (authStore.currentUser?.name === 'Jean') return 'Izzy'
  if (authStore.currentUser?.name === 'Izzy') return 'Jean'
  
  return 'Unknown'
}

const updateSelectedCategory = (transactionId: string, categoryId: string) => {
  selectedCategories[transactionId] = categoryId
}

const categorizeTransaction = async (transactionId: string, categoryId: string | undefined) => {
  if (!categoryId) return
  
  try {
    await budgetStore.categorizeTransaction(transactionId, categoryId)
    delete selectedCategories[transactionId]
  } catch (error) {
    console.error('Error categorizing transaction:', error)
  }
}

const autoCategorizeSingle = async (transaction: any) => {
  isProcessingSingle[transaction.id] = true
  
  try {
    const categories = budgetStore.categories.map(c => ({ name: c.name, id: c.id }))
    const result = await categorizeTransactionWithAI(transaction.description, categories)
    
    if (result.categoryId) {
      await budgetStore.categorizeTransaction(transaction.id, result.categoryId)
      
      // Update confidence score
      await supabase
        .from('transactions')
        .update({ confidence_score: result.confidence })
        .eq('id', transaction.id)
    }
  } catch (error) {
    console.error('Error auto-categorizing transaction:', error)
  } finally {
    isProcessingSingle[transaction.id] = false
  }
}

const categorizeAllUncategorized = async () => {
  isProcessing.value = true
  
  try {
    const categories = budgetStore.categories.map(c => ({ name: c.name, id: c.id }))
    
    for (const transaction of budgetStore.uncategorizedTransactions) {
      try {
        const result = await categorizeTransactionWithAI(transaction.description, categories)
        
        if (result.categoryId && result.confidence > 0.7) {
          await budgetStore.categorizeTransaction(transaction.id, result.categoryId)
          
          // Update confidence score
          await supabase
            .from('transactions')
            .update({ confidence_score: result.confidence })
            .eq('id', transaction.id)
        }
      } catch (error) {
        console.error(`Error categorizing transaction ${transaction.id}:`, error)
      }
    }
  } catch (error) {
    console.error('Error auto-categorizing transactions:', error)
  } finally {
    isProcessing.value = false
  }
}

const addTransaction = async () => {
  const user = authStore.currentUser
  if (!user) return
  
  try {
    let debtorId = null
    let debtAmount = null
    let paybackFromUserId = null
    
    // Handle IOU logic
    if (transactionForm.value.is_debt && transactionForm.value.debt_debtor) {
      const { data: debtorUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('name', transactionForm.value.debt_debtor)
        .single()

      if (userError || !debtorUser) throw new Error('Debtor user not found')
      
      debtorId = debtorUser.id
      debtAmount = (transactionForm.value.amount * transactionForm.value.debt_split_percentage) / 100
    }

    // Handle payback logic - get user ID for payback
    if (transactionForm.value.is_payback && transactionForm.value.payback_from_user) {
      const { data: paybackUser, error: paybackUserError } = await supabase
        .from('users')
        .select('id')
        .eq('name', transactionForm.value.payback_from_user)
        .single()

      if (paybackUserError || !paybackUser) throw new Error('Payback user not found')
      paybackFromUserId = paybackUser.id
    }

    const { data: insertedTransaction, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        bank_account_id: transactionForm.value.bank_account_id,
        description: transactionForm.value.description,
        amount: transactionForm.value.amount,
        date: transactionForm.value.date,
        is_income: transactionForm.value.is_income,
        category_id: transactionForm.value.category_id || null,
        is_categorized: !!transactionForm.value.category_id,
        // IOU fields
        is_debt: transactionForm.value.is_debt,
        debt_creditor_id: transactionForm.value.is_debt ? user.id : null,
        debt_debtor_id: debtorId,
        debt_split_percentage: transactionForm.value.is_debt ? transactionForm.value.debt_split_percentage : null,
        debt_status: transactionForm.value.is_debt ? 'active' : null,
        debt_remaining_amount: debtAmount,
        // Payback fields
        is_payback: transactionForm.value.is_payback,
        payback_from_user_id: paybackFromUserId,
        // Highlight field
        is_highlighted: false
      })
      .select()
      .single()

    if (error) throw error

    // Process payback: reduce IOU balances
    if (transactionForm.value.is_payback && paybackFromUserId) {
      await processPaybackTransaction(paybackFromUserId, transactionForm.value.amount)
    }
    
    // Assign tags if any were selected
    if (transactionForm.value.selectedTags && transactionForm.value.selectedTags.length > 0) {
      const { data: createdTransaction } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('description', transactionForm.value.description)
        .eq('amount', transactionForm.value.amount)
        .eq('date', transactionForm.value.date)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (createdTransaction) {
        for (const tagId of transactionForm.value.selectedTags) {
          await budgetStore.assignTagToTransaction(createdTransaction.id, tagId)
        }
      }
    }
    
    await loadData()
    resetTransactionForm()
  } catch (error) {
    console.error('Error adding transaction:', error)
    alert('Failed to add transaction. Please try again.')
  }
}

const resetTransactionForm = () => {
  transactionForm.value = {
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    is_income: false,
    category_id: '',
    bank_account_id: '',
    selectedTags: [],
    is_debt: false,
    debt_debtor: '',
    debt_split_percentage: 50,
    is_payback: false,
    payback_from_user: ''
  }
}

const processPaybackTransaction = async (paybackFromUserId: string, paybackAmount: number) => {
  const user = authStore.currentUser
  if (!user) return
  
  try {
    // Find active IOUs where the payback user owes the current user money
    const { data: activeIOUs, error: iouError } = await supabase
      .from('transactions')
      .select('*')
      .eq('is_debt', true)
      .eq('debt_status', 'active')
      .eq('debt_creditor_id', user.id) // current user is owed money
      .eq('debt_debtor_id', paybackFromUserId) // payback user owes money
      .gt('debt_remaining_amount', 0) // has remaining debt
      .order('date', { ascending: true }) // oldest debts first

    if (iouError) throw iouError

    if (!activeIOUs || activeIOUs.length === 0) {
      console.warn('No active IOUs found for payback processing')
      return
    }

    let remainingPayback = paybackAmount

    // Process each IOU until payback amount is exhausted
    for (const iou of activeIOUs) {
      if (remainingPayback <= 0) break

      const currentDebt = iou.debt_remaining_amount || 0
      const paymentToThisIOU = Math.min(remainingPayback, currentDebt)
      const newRemainingAmount = currentDebt - paymentToThisIOU
      const newStatus = newRemainingAmount <= 0 ? 'paid' : 'active'

      // Update the IOU transaction
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          debt_remaining_amount: Math.max(0, newRemainingAmount),
          debt_status: newStatus
        })
        .eq('id', iou.id)

      if (updateError) throw updateError

      // Record the payment in debt_payments table for tracking
      const { error: paymentError } = await supabase
        .from('debt_payments')
        .insert({
          transaction_id: iou.id,
          payer_id: paybackFromUserId,
          amount: paymentToThisIOU,
          payment_method: 'Payback Transaction',
          notes: `Automatic payback payment of $${paymentToThisIOU.toFixed(2)}`,
          payment_date: new Date().toISOString().split('T')[0]
        })

      if (paymentError) throw paymentError

      remainingPayback -= paymentToThisIOU

      console.log(`Applied $${paymentToThisIOU.toFixed(2)} payback to IOU ${iou.id}, remaining debt: $${newRemainingAmount.toFixed(2)}`)
    }

    if (remainingPayback > 0) {
      console.warn(`Payback amount exceeded available IOUs by $${remainingPayback.toFixed(2)}`)
    }

    console.log('Payback transaction processed successfully')
  } catch (error) {
    console.error('Error processing payback transaction:', error)
    throw error
  }
}

const cancelAddTransaction = () => {
  resetTransactionForm()
}

const openIOUModal = (transaction: any) => {
  selectedTransaction.value = transaction
  iouForm.value = {
    debtor: '',
    splitPercentage: 50
  }
  showIOUModal.value = true
}

const markAsIOU = async () => {
  if (!selectedTransaction.value || !authStore.currentUser) return
  
  try {
    // Get the debtor user's ID
    const { data: debtorUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('name', iouForm.value.debtor)
      .single()

    if (userError || !debtorUser) throw new Error('Debtor user not found')

    // Calculate the debt amount
    const debtAmount = (selectedTransaction.value.amount * iouForm.value.splitPercentage) / 100

    // Update the transaction to mark it as a debt
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        is_debt: true,
        debt_creditor_id: authStore.currentUser.id, // current user paid, so they are owed money
        debt_debtor_id: debtorUser.id, // selected debtor owes money
        debt_split_percentage: iouForm.value.splitPercentage,
        debt_status: 'active',
        debt_remaining_amount: debtAmount
      })
      .eq('id', selectedTransaction.value.id)

    if (updateError) throw updateError

    // Update local state optimistically
    const transactionIndex = budgetStore.transactions.findIndex(t => t.id === selectedTransaction.value?.id)
    if (transactionIndex !== -1 && authStore.currentUser?.id && budgetStore.transactions[transactionIndex]) {
      const existingTransaction = budgetStore.transactions[transactionIndex]!
      budgetStore.transactions[transactionIndex] = {
        ...existingTransaction,
        is_debt: true,
        debt_creditor_id: authStore.currentUser.id,
        debt_debtor_id: debtorUser.id,
        debt_split_percentage: iouForm.value.splitPercentage,
        debt_status: 'active',
        debt_remaining_amount: debtAmount
      }
    }

    cancelIOU()
    alert('Transaction marked as IOU successfully!')
  } catch (error) {
    console.error('Error marking transaction as IOU:', error)
    alert('Failed to mark transaction as IOU. Please try again.')
  }
}

const openPaymentModal = (transaction: any) => {
  selectedTransaction.value = transaction
  paymentForm.value = {
    amount: transaction.debt_remaining_amount || 0,
    paymentMethod: '',
    notes: ''
  }
  showPaymentModal.value = true
}

const makePayment = async () => {
  if (!selectedTransaction.value || !authStore.currentUser) return
  
  try {
    // Record the payment in debt_payments table
    const { error: paymentError } = await supabase
      .from('debt_payments')
      .insert({
        transaction_id: selectedTransaction.value.id,
        payer_id: authStore.currentUser.id,
        amount: paymentForm.value.amount,
        payment_method: paymentForm.value.paymentMethod,
        notes: paymentForm.value.notes,
        payment_date: new Date().toISOString().split('T')[0]
      })

    if (paymentError) throw paymentError

    // Update the remaining amount on the transaction
    const newRemainingAmount = selectedTransaction.value.debt_remaining_amount - paymentForm.value.amount
    const newStatus = newRemainingAmount <= 0 ? 'paid' : 'active'

    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        debt_remaining_amount: Math.max(0, newRemainingAmount),
        debt_status: newStatus
      })
      .eq('id', selectedTransaction.value.id)

    if (updateError) throw updateError

    // Update local state optimistically
    const transactionIndex = budgetStore.transactions.findIndex(t => t.id === selectedTransaction.value?.id)
    if (transactionIndex !== -1 && budgetStore.transactions[transactionIndex]) {
      const existingTransaction = budgetStore.transactions[transactionIndex]!
      budgetStore.transactions[transactionIndex] = {
        ...existingTransaction,
        debt_remaining_amount: Math.max(0, newRemainingAmount),
        debt_status: newStatus
      }
    }

    cancelPayment()
    alert('Payment recorded successfully!')
  } catch (error) {
    console.error('Error recording payment:', error)
    alert('Failed to record payment. Please try again.')
  }
}

const cancelIOU = () => {
  showIOUModal.value = false
  selectedTransaction.value = null
  iouForm.value = {
    debtor: '',
    splitPercentage: 50
  }
}

const cancelPayment = () => {
  showPaymentModal.value = false
  selectedTransaction.value = null
  paymentForm.value = {
    amount: 0,
    paymentMethod: '',
    notes: ''
  }
}

const openMarkAsPaybackModal = (transaction: any) => {
  selectedTransaction.value = transaction
  paybackForm.value = {
    paybackFromUser: ''
  }
  showMarkAsPaybackModal.value = true
}

const cancelMarkAsPayback = () => {
  showMarkAsPaybackModal.value = false
  selectedTransaction.value = null
  paybackForm.value = {
    paybackFromUser: ''
  }
}

const markAsPayback = async () => {
  if (!selectedTransaction.value || !authStore.currentUser || !paybackForm.value.paybackFromUser) return

  try {
    // Get the payback user's ID
    const { data: paybackUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('name', paybackForm.value.paybackFromUser)
      .single()

    if (userError || !paybackUser) throw new Error('Payback user not found')

    // Update the transaction to mark it as a payback
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        is_payback: true,
        payback_from_user_id: paybackUser.id
      })
      .eq('id', selectedTransaction.value.id)

    if (updateError) throw updateError

    // Process the payback to reduce IOU balances
    await processPaybackTransaction(paybackUser.id, selectedTransaction.value.amount)

    // Update local state optimistically
    const transactionIndex = budgetStore.transactions.findIndex(t => t.id === selectedTransaction.value?.id)
    if (transactionIndex !== -1 && budgetStore.transactions[transactionIndex]) {
      const existingTransaction = budgetStore.transactions[transactionIndex]!
      budgetStore.transactions[transactionIndex] = {
        ...existingTransaction,
        is_payback: true,
        payback_from_user_id: paybackUser.id
      }
    }

    cancelMarkAsPayback()
    alert('Transaction marked as payback successfully!')
  } catch (error) {
    console.error('Error marking transaction as payback:', error)
    alert('Failed to mark transaction as payback. Please try again.')
  }
}

const unmarkAsIOU = async (transaction: any) => {
  if (!confirm('Are you sure you want to remove the IOU status from this transaction? This will delete all associated payment records.')) {
    return
  }

  try {
    // First, delete any associated debt payments
    const { error: paymentsError } = await supabase
      .from('debt_payments')
      .delete()
      .eq('transaction_id', transaction.id)

    if (paymentsError) throw paymentsError

    // Then update the transaction to remove IOU status
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        is_debt: false,
        debt_creditor_id: null,
        debt_debtor_id: null,
        debt_split_percentage: null,
        debt_status: null,
        debt_remaining_amount: null
      })
      .eq('id', transaction.id)

    if (updateError) throw updateError

    // Update local state optimistically
    const transactionIndex = budgetStore.transactions.findIndex(t => t.id === transaction.id)
    if (transactionIndex !== -1 && budgetStore.transactions[transactionIndex]) {
      const existingTransaction = budgetStore.transactions[transactionIndex]!
      budgetStore.transactions[transactionIndex] = {
        ...existingTransaction,
        is_debt: false,
        debt_creditor_id: null,
        debt_debtor_id: null,
        debt_split_percentage: null,
        debt_status: null,
        debt_remaining_amount: null
      }
    }

    alert('IOU status removed successfully!')
  } catch (error) {
    console.error('Error unmarking transaction as IOU:', error)
    alert('Failed to remove IOU status. Please try again.')
  }
}

// Track update states for visual feedback
const updateStates = reactive<Record<string, 'saving' | 'success' | 'error' | null>>({})

const updateTransaction = async (transactionId: string, field: string, value: any) => {
  const originalTransaction = budgetStore.transactions.find(t => t.id === transactionId)
  if (!originalTransaction) return
  
  const originalValue = originalTransaction[field as keyof typeof originalTransaction]
  const updateKey = `${transactionId}-${field}`
  
  // Show saving state
  updateStates[updateKey] = 'saving'
  
  try {
    const updateData: any = { [field]: value }
    
    // Special handling for category updates
    if (field === 'category_id') {
      updateData.is_categorized = !!value
    }
    
    // Optimistically update local state
    const transactionIndex = budgetStore.transactions.findIndex(t => t.id === transactionId)
    if (transactionIndex !== -1) {
      budgetStore.transactions[transactionIndex] = { 
        ...budgetStore.transactions[transactionIndex], 
        ...updateData 
      }
    }
    
    const { error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', transactionId)

    if (error) throw error
    
    // Show success state
    updateStates[updateKey] = 'success'
    
    // Clear success state after 2 seconds
    setTimeout(() => {
      updateStates[updateKey] = null
    }, 2000)
    
  } catch (error) {
    console.error('Error updating transaction:', error)
    
    // Revert optimistic update on error
    const transactionIndex = budgetStore.transactions.findIndex(t => t.id === transactionId)
    if (transactionIndex !== -1 && budgetStore.transactions[transactionIndex]) {
      const existingTransaction = budgetStore.transactions[transactionIndex]!
      budgetStore.transactions[transactionIndex] = {
        ...existingTransaction,
        [field]: originalValue
      }
    }
    
    // Show error state
    updateStates[updateKey] = 'error'
    
    // Clear error state after 2 seconds
    setTimeout(() => {
      updateStates[updateKey] = null
    }, 2000)
  }
}

const updateTransactionTags = async (transactionId: string, newTagIds: string[]) => {
  const updateKey = `${transactionId}-tags`
  const currentTags = getTagsForTransaction(transactionId)
  const currentTagIds = currentTags.map(t => t.id)
  
  // Show saving state
  updateStates[updateKey] = 'saving'
  
  try {
    // Find tags to add and remove
    const tagsToAdd = newTagIds.filter(id => !currentTagIds.includes(id))
    const tagsToRemove = currentTagIds.filter(id => !newTagIds.includes(id))
    
    // Remove tags that are no longer selected
    for (const tagId of tagsToRemove) {
      await budgetStore.removeTagFromTransaction(transactionId, tagId)
    }
    
    // Add new tags
    for (const tagId of tagsToAdd) {
      await budgetStore.assignTagToTransaction(transactionId, tagId)
    }
    
    // Show success state
    updateStates[updateKey] = 'success'
    
    // Clear success state after 2 seconds
    setTimeout(() => {
      updateStates[updateKey] = null
    }, 2000)
    
  } catch (error) {
    console.error('Error updating transaction tags:', error)
    
    // Show error state
    updateStates[updateKey] = 'error'
    
    // Clear error state after 2 seconds
    setTimeout(() => {
      updateStates[updateKey] = null
    }, 2000)
  }
}

const getUpdateClass = (transactionId: string, field: string) => {
  const updateKey = `${transactionId}-${field}`
  const state = updateStates[updateKey]
  
  switch (state) {
    case 'saving':
      return 'ring-2 ring-blue-300 bg-blue-50'
    case 'success':
      return 'ring-2 ring-green-300 bg-green-50'
    case 'error':
      return 'ring-2 ring-red-300 bg-red-50'
    default:
      return ''
  }
}

const getTagsForTransaction = (transactionId: string) => {
  return budgetStore.getTagsForTransaction(transactionId)
}

const openTagModal = (transaction: any) => {
  selectedTransaction.value = transaction
  showTagModal.value = true
}

const removeTagFromTransaction = async (transactionId: string, tagId: string) => {
  try {
    await budgetStore.removeTagFromTransaction(transactionId, tagId)
  } catch (error) {
    console.error('Error removing tag:', error)
    alert('Failed to remove tag. Please try again.')
  }
}

const assignTagToTransaction = async (transactionId: string, tagId: string) => {
  try {
    await budgetStore.assignTagToTransaction(transactionId, tagId)
  } catch (error) {
    console.error('Error assigning tag:', error)
    alert('Failed to assign tag. Please try again.')
  }
}

const addSelectedTag = async () => {
  if (!selectedTagToAdd.value || !selectedTransaction.value) return
  
  try {
    await assignTagToTransaction(selectedTransaction.value.id, selectedTagToAdd.value)
    selectedTagToAdd.value = ''
  } catch (error) {
    console.error('Error adding tag:', error)
  }
}

const closeTagModal = () => {
  showTagModal.value = false
  selectedTransaction.value = null
  selectedTagToAdd.value = ''
}

const handleTransactionsSaved = () => {
  showPasteModal.value = false
  loadData() // Refresh the transactions list
}

const getCategoryName = (categoryId: string) => {
  const category = budgetStore.categories.find(c => c.id === categoryId)
  return category?.name || 'Unknown Category'
}

const openApplyToAllModal = (categoryId: string) => {
  selectedCategoryForApplyAll.value = categoryId
  applyToAllSuccess.value = false
  appliedCount.value = 0
  showApplyToAllModal.value = true
}

const closeApplyToAllModal = () => {
  showApplyToAllModal.value = false
  selectedCategoryForApplyAll.value = ''
  applyToAllSuccess.value = false
  appliedCount.value = 0
}

const applyToAllTransactions = async () => {
  if (!selectedCategoryForApplyAll.value) return

  isApplyingToAll.value = true

  try {
    // Get all visible transaction IDs
    const transactionIds = filteredTransactions.value.map(t => t.id)

    // Update all transactions in parallel
    const updatePromises = transactionIds.map(id =>
      supabase
        .from('transactions')
        .update({
          category_id: selectedCategoryForApplyAll.value,
          is_categorized: true
        })
        .eq('id', id)
    )

    await Promise.all(updatePromises)

    // Update local state optimistically without reloading
    transactionIds.forEach(id => {
      const transaction = budgetStore.transactions.find(t => t.id === id)
      if (transaction) {
        transaction.category_id = selectedCategoryForApplyAll.value
        transaction.is_categorized = true
      }
    })

    appliedCount.value = transactionIds.length
    applyToAllSuccess.value = true
  } catch (error) {
    console.error('Error applying category to all transactions:', error)
    alert('Failed to apply category to all transactions. Please try again.')
    closeApplyToAllModal()
  } finally {
    isApplyingToAll.value = false
  }
}

const openNotesModal = (transaction: any) => {
  selectedTransaction.value = transaction
  noteText.value = transaction.notes || ''
  showNotesModal.value = true
}

const closeNotesModal = () => {
  showNotesModal.value = false
  selectedTransaction.value = null
  noteText.value = ''
}

const saveNote = async () => {
  if (!selectedTransaction.value) return

  isSavingNote.value = true

  try {
    const { error } = await supabase
      .from('transactions')
      .update({ notes: noteText.value || null })
      .eq('id', selectedTransaction.value.id)

    if (error) throw error

    // Update local state optimistically
    const transaction = budgetStore.transactions.find(t => t.id === selectedTransaction.value.id)
    if (transaction) {
      transaction.notes = noteText.value || null
    }

    closeNotesModal()
  } catch (error) {
    console.error('Error saving note:', error)
    alert('Failed to save note. Please try again.')
  } finally {
    isSavingNote.value = false
  }
}

const loadData = async () => {
  const user = authStore.currentUser
  if (!user) return
  
  // Get the current period, but if it's not available, use the dateRange directly
  let currentPeriod = dateRangeStore.currentPeriod
  
  // Fallback: if currentPeriod is not initialized but dateRange exists, use dateRange directly
  if ((!currentPeriod || !currentPeriod.start || !currentPeriod.end) && dateRangeStore.dateRange && dateRangeStore.dateRange.length === 2) {
    currentPeriod = {
      start: dateRangeStore.dateRange[0],
      end: dateRangeStore.dateRange[1]
    }
    console.log('Using dateRange directly for loadData:', currentPeriod)
  }
  
  if (!currentPeriod || !currentPeriod.start || !currentPeriod.end) {
    console.warn('Date range not initialized, skipping loadData. CurrentPeriod:', currentPeriod, 'DateRange:', dateRangeStore.dateRange)
    return
  }
  
  console.log('Loading transactions for period:', currentPeriod.start, 'to', currentPeriod.end)
  
  await Promise.all([
    budgetStore.loadCategories(),
    budgetStore.loadTransactions(currentPeriod.start, currentPeriod.end),
    budgetStore.loadTransactionTags(),
    budgetStore.loadTagAssignments(),
    bankAccountStore.loadBankAccounts()
  ])
  
  // Debug: Check highlight status of loaded transactions
  const highlightedCount = budgetStore.transactions.filter(t => t.is_highlighted).length
  const undefinedHighlightCount = budgetStore.transactions.filter(t => t.is_highlighted === undefined).length
  console.log(`Loaded ${budgetStore.transactions.length} transactions:`)
  console.log(`- ${highlightedCount} highlighted`)
  console.log(`- ${undefinedHighlightCount} with undefined is_highlighted`)
  console.log('Sample transactions:', budgetStore.transactions.slice(0, 3).map(t => ({
    id: t.id, 
    description: t.description, 
    is_highlighted: t.is_highlighted,
    typeof_highlighted: typeof t.is_highlighted
  })))
}

onMounted(async () => {
  // Initialize date range first
  dateRangeStore.initializeCurrentMonth()

  // Set tag filter from URL query parameter
  if (route.query.tag) {
    filters.value.tag = route.query.tag as string
  }

  // Then load data
  await loadData()
})
watch(() => authStore.currentUser, loadData)
watch(() => authStore.viewAllMode, loadData)
watch(
  () => dateRangeStore.dateRange,
  (newRange, oldRange) => {
    console.log('Date range watcher triggered!')
    console.log('Old range:', oldRange)
    console.log('New range:', newRange)
    if (newRange && newRange !== oldRange) {
      console.log('Loading data due to date range change...')
      loadData()
    }
  },
  { deep: true }
)
</script>

<style scoped>
/* Make Element Plus selects match input box height */
:deep(.filter-select .el-input__wrapper) {
  height: 38px;
  padding: 0 12px;
}

:deep(.filter-select .el-input__inner) {
  height: 36px;
  line-height: 36px;
}
</style>