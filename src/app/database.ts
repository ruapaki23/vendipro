import { supabase } from './supabase'

export interface Machine {
  id?: number
  location: string
  code: string
  revenue: number
  partner: string
  split: number
  status: string
  created_at?: string
}

export interface Transaction {
  id?: number
  machine_id: number
  amount: number
  date: string
  type: 'sale' | 'maintenance' | 'restock'
  description?: string
  created_at?: string
}

// Machine Operations
export const machineOperations = {
  // Get all machines
  async getAll(): Promise<{ data: Machine[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('machines')
        .select('*')
        .order('created_at', { ascending: false })
      
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Add new machine
  async create(machine: Omit<Machine, 'id' | 'created_at'>): Promise<{ data: Machine[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('machines')
        .insert([machine])
        .select()
      
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Update machine
  async update(id: number, updates: Partial<Machine>): Promise<{ data: Machine[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('machines')
        .update(updates)
        .eq('id', id)
        .select()
      
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Delete machine
  async delete(id: number): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('machines')
        .delete()
        .eq('id', id)
      
      return { error }
    } catch (error) {
      return { error }
    }
  },

  // Add revenue to machine
  async addRevenue(id: number, additionalRevenue: number): Promise<{ data: Machine[] | null; error: any }> {
    try {
      // First get current revenue
      const { data: currentMachine, error: getError } = await supabase
        .from('machines')
        .select('revenue')
        .eq('id', id)
        .single()

      if (getError) return { data: null, error: getError }

      // Add to current revenue
      const newRevenue = currentMachine.revenue + additionalRevenue

      // Update machine with new revenue
      const { data, error } = await supabase
        .from('machines')
        .update({ revenue: newRevenue })
        .eq('id', id)
        .select()
      
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Initialize sample data (only if no machines exist)
  async initializeSampleData(): Promise<{ data: Machine[] | null; error: any }> {
    try {
      const { data: existing, error: checkError } = await this.getAll()
      
      if (checkError) {
        return { data: null, error: checkError }
      }
      
      if (existing && existing.length > 0) {
        return { data: existing, error: null }
      }
      
      const sampleMachines: Omit<Machine, 'id' | 'created_at'>[] = [
        { location: 'Auckland Mall', code: 'AKL001', revenue: 2450.30, partner: 'Coca Cola', split: 70, status: 'active' },
        { location: 'Wellington Station', code: 'WLG002', revenue: 1823.50, partner: 'Independent', split: 15, status: 'active' },
        { location: 'Christchurch Airport', code: 'CHC003', revenue: 3201.80, partner: 'Pepsi', split: 60, status: 'active' }
      ]

      const { data, error } = await supabase
        .from('machines')
        .insert(sampleMachines)
        .select()
      
      return { data, error }
      
    } catch (error) {
      return { data: null, error }
    }
  }
}

// Transaction Operations
export const transactionOperations = {
  // Get all transactions (simplified - no join for now)
  async getAll(): Promise<{ data: any[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) return { data: null, error }

      // Get machine details separately to avoid join issues
      if (data && data.length > 0) {
        const { data: machines } = await supabase
          .from('machines')
          .select('id, location, code')

        // Add machine details to each transaction
        const transactionsWithMachines = data.map(transaction => {
          const machine = machines?.find(m => m.id === transaction.machine_id)
          return {
            ...transaction,
            machines: machine || null
          }
        })

        return { data: transactionsWithMachines, error: null }
      }
      
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get transactions for specific machine
  async getByMachine(machineId: number): Promise<{ data: Transaction[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('machine_id', machineId)
        .order('created_at', { ascending: false })
      
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Record a sale transaction
  async recordSale(machineId: number, amount: number, description?: string): Promise<{ data: Transaction[] | null; error: any }> {
    try {
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      
      const transaction = {
        machine_id: machineId,
        amount: amount,
        date: today,
        type: 'sale' as const,
        description: description || null
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert([transaction])
        .select()
      
      if (error) return { data: null, error }

      // Also update machine revenue
      await machineOperations.addRevenue(machineId, amount)
      
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }
}

// Revenue Calculations
export const revenueCalculations = {
  // Calculate your share from a machine's revenue
  calculateYourShare(revenue: number, partnerSplit: number): number {
    return revenue * (100 - partnerSplit) / 100
  },

  // Calculate partner share
  calculatePartnerShare(revenue: number, partnerSplit: number): number {
    return revenue * partnerSplit / 100
  },

  // Calculate GST (15% NZ rate)
  calculateGST(amount: number): number {
    return amount * 0.15
  },

  // Calculate revenue shares for a transaction
  calculateTransactionShares(amount: number, partnerSplit: number) {
    const yourShare = this.calculateYourShare(amount, partnerSplit)
    const partnerShare = this.calculatePartnerShare(amount, partnerSplit)
    const gst = this.calculateGST(yourShare)
    
    return {
      yourShare,
      partnerShare,
      gst,
      yourShareAfterGST: yourShare - gst
    }
  },

  // Calculate totals for dashboard
  calculateTotals(machines: Machine[]) {
    const totalRevenue = machines.reduce((sum, machine) => sum + machine.revenue, 0)
    const yourIncome = machines.reduce((sum, machine) => {
      return sum + this.calculateYourShare(machine.revenue, machine.split)
    }, 0)
    const partnerIncome = totalRevenue - yourIncome
    const activeMachines = machines.filter(m => m.status === 'active').length

    return {
      totalRevenue,
      yourIncome,
      partnerIncome,
      activeMachines,
      gstOwed: this.calculateGST(yourIncome)
    }
  }
}

// Error handling utilities
export const errorHandler = {
  // Format error for user display
  formatError(error: any): string {
    if (!error) return 'Unknown error occurred'
    if (error.message) return error.message
    if (typeof error === 'string') return error
    return 'An unexpected error occurred'
  },

  // Log error for debugging
  logError(context: string, error: any) {
    console.error(`VendiPro Error [${context}]:`, error)
  }
}