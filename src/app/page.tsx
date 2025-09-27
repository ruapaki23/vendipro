'use client'

import { useState, useEffect } from 'react'
import { supabase } from './supabase'

interface Machine {
  id: number
  location: string
  code: string
  partner: string
  split: number
  status: string
  revenue: number
}

interface Transaction {
  id: number
  machine_id: number
  amount: number
  date: string
  type: string
  description: string
  created_at: string
}

interface Employee {
  id: number
  name: string
  email: string
  role: string
  phone: string
  hire_date: string
  hourly_rate: number
  is_active: boolean
  created_at: string
}

interface Expense {
  id: number
  machine_id: number | null
  category: string
  description: string
  amount: number
  date: string
  recurring: boolean
  created_at: string
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [machines, setMachines] = useState<Machine[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMachine, setEditingMachine] = useState<number | null>(null)
   const [editingMachineData, setEditingMachineData] = useState<Partial<Machine>>({})
  const [recordingSale, setRecordingSale] = useState<number | null>(null)
  const [showEmployeeForm, setShowEmployeeForm] = useState(false)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showMachineForm, setShowMachineForm] = useState(false)
  
  const [newMachine, setNewMachine] = useState({
    location: '',
    code: '',
    partner: '',
    split: 70,
    status: 'active'
  })

  const [newSale, setNewSale] = useState({
    amount: '',
    description: 'Sale',
    date: new Date().toISOString().split('T')[0]
  })

  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    role: 'Staff',
    phone: '',
    hire_date: '',
    hourly_rate: ''
  })

  const [newExpense, setNewExpense] = useState({
    machine_id: '',
    category: 'Electricity',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    recurring: false
  })

  useEffect(() => {
    loadMachines()
    loadTransactions()
    loadEmployees()
    loadExpenses()
  }, [])

  const loadMachines = async () => {
    try {
      const { data, error } = await supabase
        .from('machines')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setMachines(data || [])
    } catch (error) {
      console.error('Error loading machines:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Error loading transactions:', error)
    }
  }

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error('Error loading employees:', error)
    }
  }

  const loadExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setExpenses(data || [])
    } catch (error) {
      console.error('Error loading expenses:', error)
    }
  }

  const addMachine = async () => {
    try {
      if (!newMachine.location.trim() || !newMachine.code.trim() || !newMachine.partner.trim()) {
  alert('Location, Code, and Partner are required')
  return
}
      const { error } = await supabase
        .from('machines')
        .insert([{ ...newMachine, revenue: 0 }])

      if (error) throw error
      setNewMachine({ location: '', code: '', partner: '', split: 70, status: 'active' })
      loadMachines()
    } catch (error) {
      console.error('Error adding machine:', error)
    }
  }

  const updateMachine = async (id: number, updates: Partial<Machine>) => {
    try {
      if (!updates.location?.trim() || !updates.code?.trim() || !updates.partner?.trim()) {
  alert('Location, Code, and Partner are required')
  return
}
      const { error } = await supabase
        .from('machines')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      setEditingMachine(null)
      loadMachines()
    } catch (error) {
      console.error('Error updating machine:', error)
    }
  }

  const deleteMachine = async (id: number) => {
    if (!confirm('Are you sure you want to delete this machine?')) return
    
    try {
      const { error } = await supabase
        .from('machines')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadMachines()
    } catch (error) {
      console.error('Error deleting machine:', error)
    }
  }

  const recordSale = async (machineId: number) => {
    try {
      const amount = parseFloat(newSale.amount)
      if (!amount || amount <= 0) return

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          machine_id: machineId,
          amount: amount,
          date: newSale.date,
          type: 'sale',
          description: newSale.description
        }])

      if (transactionError) throw transactionError

      const machine = machines.find(m => m.id === machineId)
      if (machine) {
        const { error: machineError } = await supabase
          .from('machines')
          .update({ revenue: machine.revenue + amount })
          .eq('id', machineId)

        if (machineError) throw machineError
      }

      setNewSale({ 
        amount: '', 
        description: 'Sale',
        date: new Date().toISOString().split('T')[0]
      })
      setRecordingSale(null)
      loadMachines()
      loadTransactions()
    } catch (error) {
      console.error('Error recording sale:', error)
    }
  }

  const addEmployee = async () => {
    try {
      const employeeData = {
        name: newEmployee.name,
        email: newEmployee.email,
        role: newEmployee.role,
        phone: newEmployee.phone || null,
        hire_date: newEmployee.hire_date,
        hourly_rate: newEmployee.hourly_rate ? parseFloat(newEmployee.hourly_rate) : null,
        is_active: true
      }

      const { error } = await supabase
        .from('employees')
        .insert([employeeData])

      if (error) throw error

      setNewEmployee({
        name: '',
        email: '',
        role: 'Staff',
        phone: '',
        hire_date: '',
        hourly_rate: ''
      })
      setShowEmployeeForm(false)
      loadEmployees()
    } catch (error) {
      console.error('Error adding employee:', error)
    }
  }

  const addExpense = async () => {
    try {
      if (!newExpense.description || !newExpense.amount) {
        alert('Please fill in description and amount')
        return
      }

      const expenseData = {
        machine_id: newExpense.machine_id ? parseInt(newExpense.machine_id) : null,
        category: newExpense.category,
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        date: newExpense.date,
        recurring: newExpense.recurring,
        created_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('expenses')
        .insert([expenseData])

      if (error) throw error

      setNewExpense({
        machine_id: '',
        category: 'Electricity',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        recurring: false
      })
      setShowExpenseForm(false)
      loadExpenses()
    } catch (error) {
      console.error('Error adding expense:', error)
      alert('Error saving expense. Check console for details.')
    }
  }

  const toggleEmployeeStatus = async (employeeId: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({ is_active: !currentStatus })
        .eq('id', employeeId)

      if (error) throw error
      loadEmployees()
    } catch (error) {
      console.error('Error updating employee status:', error)
    }
  }

  const totalRevenue = machines.reduce((sum, machine) => sum + machine.revenue, 0)
  const yourIncome = machines.reduce((sum, machine) => {
    const yourShare = (100 - machine.split) / 100
    return sum + (machine.revenue * yourShare)
  }, 0)
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const netProfit = yourIncome - totalExpenses
  const activeMachines = machines.filter(m => m.status === 'active').length
  const partnerRevenue = totalRevenue - yourIncome
  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading VendiPro...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">VendiPro</h1>
          <p className="text-gray-600">Professional Vending Machine Management</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex space-x-1 mt-6">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'machines', label: 'Machine Management' },
            { id: 'sales', label: 'Sales & Revenue' },
            { id: 'expenses', label: 'Business Expenses' },
            { id: 'employees', label: 'Employee Management' },
            { id: 'analytics', label: 'Analytics & Charts' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-t-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-b-lg shadow-lg">
          <div className="p-8">

            {activeTab === 'dashboard' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">VendiPro Dashboard</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-green-100 p-6 rounded-lg">
                    <h3 className="font-bold text-green-800 mb-2">Total Revenue</h3>
                    <p className="text-3xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
                    <p className="text-green-700 text-sm">💰 All machines</p>
                  </div>
                  <div className="bg-blue-100 p-6 rounded-lg">
                    <h3 className="font-bold text-blue-800 mb-2">Your Income</h3>
                    <p className="text-3xl font-bold text-blue-600">${yourIncome.toFixed(2)}</p>
                    <p className="text-blue-700 text-sm">📈 Your share</p>
                  </div>
                  <div className="bg-purple-100 p-6 rounded-lg">
                    <h3 className="font-bold text-purple-800 mb-2">Net Profit</h3>
                    <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                      ${netProfit.toFixed(2)}
                    </p>
                    <p className="text-purple-700 text-sm">💰 After expenses</p>
                  </div>
                  <div className="bg-orange-100 p-6 rounded-lg">
                    <h3 className="font-bold text-orange-800 mb-2">Total Expenses</h3>
                    <p className="text-3xl font-bold text-orange-600">${totalExpenses.toFixed(2)}</p>
                    <p className="text-orange-700 text-sm">📊 Business costs</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => setActiveTab('machines')}
                    className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all"
                  >
                    Manage Machines
                  </button>
                  <button 
                    onClick={() => setActiveTab('expenses')}
                    className="p-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all"
                  >
                    Track Expenses
                  </button>
                  <button 
                    onClick={() => setActiveTab('analytics')}
                    className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all"
                  >
                    View Analytics
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'machines' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Machine Management</h2>
                  <button 
onClick={() => setShowMachineForm(!showMachineForm)}                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
{showMachineForm ? 'Cancel' : 'Add New Machine'}                  </button>
                </div>

{showMachineForm && (
  <div className="bg-gray-50 p-4 rounded-lg mb-6">
    <h3 className="font-medium mb-3">Add New Machine</h3>
<div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-2 text-sm font-medium text-gray-700">
  <label>Location</label>
  <label>Code</label>
  <label>Partner</label>
<label>My Share / Partner Share</label>  <label>Status</label>
</div>    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
      <input
        type="text"
        placeholder="Location"
        value={newMachine.location}
        onChange={(e) => setNewMachine({...newMachine, location: e.target.value})}
        className="border rounded px-3 py-2"
      />
      <input
        type="text"
        placeholder="Code"
        value={newMachine.code}
        onChange={(e) => setNewMachine({...newMachine, code: e.target.value})}
        className="border rounded px-3 py-2"
      />
      <input
        type="text"
        placeholder="Partner"
        value={newMachine.partner}
        onChange={(e) => setNewMachine({...newMachine, partner: e.target.value})}
        className="border rounded px-3 py-2"
      />
      <input
        type="number"
placeholder="Partner % (0-100)"        value={newMachine.split}
        onChange={(e) => setNewMachine({...newMachine, split: parseInt(e.target.value)})}
        className="border rounded px-3 py-2"
      />
      <select
        value={newMachine.status}
        onChange={(e) => setNewMachine({...newMachine, status: e.target.value})}
        className="border rounded px-3 py-2"
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="maintenance">Maintenance</option>
      </select>
    </div>
    <button 
      onClick={addMachine}
      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 mt-3"
    >
      Save Machine
    </button>
  </div>
)}
                <div className="space-y-4">
                  {machines.map(machine => (
                    <div key={machine.id} className="border rounded-lg">
{editingMachine === machine.id && (
  <div className="bg-blue-50 p-4 border-b">
    <h4 className="font-medium mb-3">Edit Machine #{machine.id}</h4>
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
      <input
        type="text"
        value={editingMachineData.location !== undefined ? editingMachineData.location : machine.location}
        onChange={(e) => setEditingMachineData({...editingMachineData, location: e.target.value})}
        className="border rounded px-3 py-2"
      />
      <input
        type="text"
value={editingMachineData.code !== undefined ? editingMachineData.code : machine.code}
        onChange={(e) => setEditingMachineData({...editingMachineData, code: e.target.value})}
        className="border rounded px-3 py-2"
      />
      <input
        type="text"
value={editingMachineData.partner !== undefined ? editingMachineData.partner : machine.partner}        onChange={(e) => setEditingMachineData({...editingMachineData, partner: e.target.value})}
        className="border rounded px-3 py-2"
      />
      <input
        type="number"
        value={editingMachineData.split || machine.split}
        onChange={(e) => setEditingMachineData({...editingMachineData, split: parseInt(e.target.value)})}
        className="border rounded px-3 py-2"
      />
      <select
        value={editingMachineData.status || machine.status}
        onChange={(e) => setEditingMachineData({...editingMachineData, status: e.target.value})}
        className="border rounded px-3 py-2"
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="maintenance">Maintenance</option>
      </select>
    </div>
    <div className="flex gap-2 mt-3">
      <button
        onClick={() => {
          updateMachine(machine.id, editingMachineData)
          setEditingMachineData({})
        }}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Save Changes
      </button>
      <button
        onClick={() => {
          setEditingMachine(null)
          setEditingMachineData({})
        }}
        className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
      >
        Cancel
      </button>
    </div>
  </div>
)}
                      {recordingSale === machine.id && (
                        <div className="bg-green-50 p-4 border-b">
                          <h4 className="font-medium mb-3">Record Sale - {machine.location}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Sale Amount ($)"
                              value={newSale.amount}
                              onChange={(e) => setNewSale({...newSale, amount: e.target.value})}
                              className="border rounded px-3 py-2"
                            />
                            <input
                              type="text"
                              placeholder="Description"
                              value={newSale.description}
                              onChange={(e) => setNewSale({...newSale, description: e.target.value})}
                              className="border rounded px-3 py-2"
                            />
                            <input
                              type="date"
                              value={newSale.date}
                              onChange={(e) => setNewSale({...newSale, date: e.target.value})}
                              className="border rounded px-3 py-2"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => recordSale(machine.id)}
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                              >
                                Record Sale
                              </button>
                              <button
                                onClick={() => setRecordingSale(null)}
                                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                          {newSale.amount && (
                            <div className="mt-2 text-sm text-gray-600">
                              Partner gets: ${(parseFloat(newSale.amount) * machine.split / 100).toFixed(2)} ({machine.split}%) • 
                              You get: ${(parseFloat(newSale.amount) * (100 - machine.split) / 100).toFixed(2)} ({100 - machine.split}%)
                            </div>
                          )}
                        </div>
                      )}

                      <div className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-bold">{machine.location}</h3>
                            <p className="text-gray-600">Code: {machine.code} • Partner: {machine.partner}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            machine.status === 'active' ? 'bg-green-100 text-green-800' :
                            machine.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {machine.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600">Total Revenue</p>
                            <p className="font-bold text-green-600">${machine.revenue.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Your Share ({100 - machine.split}%)</p>
                            <p className="font-bold text-blue-600">${(machine.revenue * (100 - machine.split) / 100).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Partner Share ({machine.split}%)</p>
                            <p className="font-bold text-purple-600">${(machine.revenue * machine.split / 100).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Revenue Split</p>
<p className="font-medium">{100 - machine.split}% / {machine.split}%</p>                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
onClick={() => {
  setEditingMachine(machine.id)
  setEditingMachineData({
    location: machine.location,
    code: machine.code,
    partner: machine.partner,
    split: machine.split,
    status: machine.status
  })
}}                            className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setRecordingSale(machine.id)}
                            className="bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200"
                          >
                            Record Sale
                          </button>
                          <button
                            onClick={() => deleteMachine(machine.id)}
                            className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'sales' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Sales & Revenue</h2>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Recent Transactions</h3>
                  <div className="space-y-3">
                    {transactions.slice(0, 20).map(transaction => {
                      const machine = machines.find(m => m.id === transaction.machine_id)
                      return (
                        <div key={transaction.id} className="flex justify-between items-center p-3 bg-white rounded border">
                          <div>
                            <p className="font-medium">${transaction.amount.toFixed(2)}</p>
                            <p className="text-sm text-gray-500">
                              {machine?.location} • {transaction.description} • {new Date(transaction.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <p>Your share: ${((transaction.amount * (100 - (machine?.split || 0)) / 100)).toFixed(2)}</p>
                            <p>Partner: ${((transaction.amount * (machine?.split || 0) / 100)).toFixed(2)}</p>
                          </div>
                        </div>
                      )
                    })}
                    {transactions.length === 0 && (
                      <p className="text-gray-500 text-center py-8">No transactions recorded yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'expenses' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Business Expenses</h2>
                  <button 
                    onClick={() => setShowExpenseForm(!showExpenseForm)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    {showExpenseForm ? 'Cancel' : 'Add Expense'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h3 className="font-medium text-red-800">Total Expenses</h3>
                    <p className="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-green-800">Your Income</h3>
                    <p className="text-2xl font-bold text-green-600">${yourIncome.toFixed(2)}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-800">Net Profit</h3>
                    <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      ${netProfit.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-medium text-purple-800">Profit Margin</h3>
                    <p className="text-2xl font-bold text-purple-600">
                      {yourIncome > 0 ? ((netProfit / yourIncome) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>

                {showExpenseForm && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="font-medium mb-3">Add Business Expense</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <select
                        value={newExpense.category}
                        onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                        className="border rounded-md px-3 py-2"
                      >
                        <option value="Electricity">Electricity</option>
                        <option value="Rent">Rent</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Insurance">Insurance</option>
                        <option value="Transport">Transport/Fuel</option>
                        <option value="Supplies">Supplies</option>
                        <option value="Other">Other</option>
                      </select>
                      <input 
                        type="text"
                        placeholder="Description"
                        value={newExpense.description}
                        onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                        className="border rounded-md px-3 py-2"
                        required
                      />
                      <input 
                        type="number"
                        step="0.01"
                        placeholder="Amount ($)"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                        className="border rounded-md px-3 py-2"
                        required
                      />
                      <input 
                        type="date"
                        value={newExpense.date}
                        onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                        className="border rounded-md px-3 py-2"
                        required
                      />
                      <select
                        value={newExpense.machine_id}
                        onChange={(e) => setNewExpense({...newExpense, machine_id: e.target.value})}
                        className="border rounded-md px-3 py-2"
                      >
                        <option value="">All Machines</option>
                        {machines.map(machine => (
                          <option key={machine.id} value={machine.id}>
                            {machine.location}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center">
                        <input 
                          type="checkbox"
                          checked={newExpense.recurring}
                          onChange={(e) => setNewExpense({...newExpense, recurring: e.target.checked})}
                          className="mr-2"
                        />
                        <label className="text-sm text-gray-600">Recurring expense</label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={addExpense}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                      >
                        Save Expense
                      </button>
                      <button 
                        onClick={() => setShowExpenseForm(false)}
className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {expenses.map(expense => {
                    const machine = machines.find(m => m.id === expense.machine_id)
                    return (
                      <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <h4 className="font-medium text-gray-900">{expense.description}</h4>
                              <p className="text-sm text-gray-500">
                                {expense.category} • {new Date(expense.date).toLocaleDateString()}
                                {machine && ` • ${machine.location}`}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              expense.category === 'Electricity' ? 'bg-yellow-100 text-yellow-800' :
                              expense.category === 'Rent' ? 'bg-blue-100 text-blue-800' :
                              expense.category === 'Maintenance' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {expense.category}
                            </span>
                            {expense.recurring && (
                              <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                                Recurring
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600">-${expense.amount.toFixed(2)}</p>
                        </div>
                      </div>
                    )
                  })}
                  {expenses.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No expenses recorded yet</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'employees' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Employee Management</h2>
                  <button 
                    onClick={() => setShowEmployeeForm(!showEmployeeForm)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    {showEmployeeForm ? 'Cancel' : 'Add Employee'}
                  </button>
                </div>

                {showEmployeeForm && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="font-medium mb-3">Add New Employee</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input 
                        type="text"
                        placeholder="Full Name"
                        value={newEmployee.name}
                        onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                        className="border rounded-md px-3 py-2"
                        required
                      />
                      <input 
                        type="email"
                        placeholder="Email"
                        value={newEmployee.email}
                        onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                        className="border rounded-md px-3 py-2"
                        required
                      />
                      <select 
                        value={newEmployee.role}
                        onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                        className="border rounded-md px-3 py-2"
                      >
                        <option value="Staff">Staff</option>
                        <option value="Manager">Manager</option>
                        <option value="Owner">Owner</option>
                      </select>
                      <input 
                        type="tel"
                        placeholder="Phone (optional)"
                        value={newEmployee.phone}
                        onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                        className="border rounded-md px-3 py-2"
                      />
                      <input 
                        type="date"
                        value={newEmployee.hire_date}
                        onChange={(e) => setNewEmployee({...newEmployee, hire_date: e.target.value})}
                        className="border rounded-md px-3 py-2"
                        required
                      />
                      <input 
                        type="number"
                        step="0.01"
                        placeholder="Hourly Rate (optional)"
                        value={newEmployee.hourly_rate}
                        onChange={(e) => setNewEmployee({...newEmployee, hourly_rate: e.target.value})}
                        className="border rounded-md px-3 py-2"
                      />
                    </div>
                    <button 
                      onClick={addEmployee}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                      Add Employee
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  {employees.map(employee => (
                    <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h4 className="font-medium text-gray-900">{employee.name}</h4>
                            <p className="text-sm text-gray-500">{employee.email}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            employee.role === 'Owner' ? 'bg-purple-100 text-purple-800' :
                            employee.role === 'Manager' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {employee.role}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            employee.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {employee.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          Hired: {new Date(employee.hire_date).toLocaleDateString()}
                          {employee.hourly_rate && ` • $${employee.hourly_rate}/hr`}
                          {employee.phone && ` • ${employee.phone}`}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleEmployeeStatus(employee.id, employee.is_active)}
                        className={`px-3 py-1 text-sm rounded-md ${
                          employee.is_active 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {employee.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  ))}
                  {employees.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No employees added yet</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Business Analytics & Charts</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-lg font-medium mb-4">Revenue Split Distribution</h3>
                    <div className="flex items-center justify-center">
                      <div className="relative w-48 h-48">
                        <svg className="w-48 h-48 transform -rotate-90">
                          <circle
                            cx="96"
                            cy="96"
                            r="80"
                            fill="transparent"
                            stroke="#e5e7eb"
                            strokeWidth="16"
                          />
                          {totalRevenue > 0 && (
                            <>
                              <circle
                                cx="96"
                                cy="96"
                                r="80"
                                fill="transparent"
                                stroke="#10b981"
                                strokeWidth="16"
                                strokeDasharray={`${(yourIncome / totalRevenue) * 502.65} 502.65`}
                                strokeDashoffset="0"
                              />
                              <circle
                                cx="96"
                                cy="96"
                                r="80"
                                fill="transparent"
                                stroke="#3b82f6"
                                strokeWidth="16"
                                strokeDasharray={`${(partnerRevenue / totalRevenue) * 502.65} 502.65`}
                                strokeDashoffset={`-${(yourIncome / totalRevenue) * 502.65}`}
                              />
                            </>
                          )}
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-2xl font-bold">${totalRevenue.toFixed(0)}</div>
                            <div className="text-sm text-gray-500">Total</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-sm">Your Income</span>
                        </div>
                        <span className="font-medium">${yourIncome.toFixed(2)} ({totalRevenue > 0 ? ((yourIncome / totalRevenue) * 100).toFixed(1) : 0}%)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                          <span className="text-sm">Partner Income</span>
                        </div>
                        <span className="font-medium">${partnerRevenue.toFixed(2)} ({totalRevenue > 0 ? ((partnerRevenue / totalRevenue) * 100).toFixed(1) : 0}%)</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-lg font-medium mb-4">Expense Breakdown</h3>
                    <div className="space-y-3">
                      {Object.entries(expensesByCategory).map(([category, amount]) => {
                        const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
                        return (
                          <div key={category} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">{category}</span>
                              <span className="text-sm">${amount.toFixed(2)} ({percentage.toFixed(1)}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div 
                                className="bg-red-500 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )
                      })}
                      {Object.keys(expensesByCategory).length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No expense data available
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border mb-8">
                  <h3 className="text-lg font-medium mb-4">Machine Performance Comparison</h3>
                  <div className="space-y-4">
                    {machines.map(machine => {
                      const percentage = totalRevenue > 0 ? (machine.revenue / totalRevenue) * 100 : 0
                      return (
                        <div key={machine.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{machine.location}</span>
                            <div className="text-right">
                              <div className="font-bold">${machine.revenue.toFixed(2)}</div>
                              <div className="text-sm text-gray-500">{percentage.toFixed(1)}% of total</div>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Your share: ${(machine.revenue * (100 - machine.split) / 100).toFixed(2)}</span>
                            <span>Partner: ${(machine.revenue * machine.split / 100).toFixed(2)}</span>
                          </div>
                        </div>
                      )
                    })}
                    {machines.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No machine data available
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-lg font-medium mb-4">Sales Distribution (Last 30 Days)</h3>
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {[...Array(30)].map((_, i) => {
                      const date = new Date()
                      date.setDate(date.getDate() - (29 - i))
                      const dayTransactions = transactions.filter(t => 
                        new Date(t.created_at).toDateString() === date.toDateString()
                      )
                      const dayTotal = dayTransactions.reduce((sum, t) => sum + t.amount, 0)
                      const maxDaily = Math.max(...[...Array(30)].map((_, j) => {
                        const d = new Date()
                        d.setDate(d.getDate() - (29 - j))
                        return transactions.filter(t => 
                          new Date(t.created_at).toDateString() === d.toDateString()
                        ).reduce((sum, t) => sum + t.amount, 0)
                      }))
                      const height = maxDaily > 0 ? (dayTotal / maxDaily) * 100 : 0
                      
                      return (
                        <div key={i} className="flex flex-col items-center">
                          <div className="w-8 bg-gray-200 rounded-t" style={{ height: '100px' }}>
                            <div 
                              className="w-full bg-blue-500 rounded-t transition-all duration-500"
                              style={{ 
                                height: `${height}%`,
                                marginTop: `${100 - height}%`
                              }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1 text-center">
                            {date.getDate()}
                          </div>
                          {dayTotal > 0 && (
                            <div className="text-xs font-medium">
                              ${dayTotal.toFixed(0)}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div className="text-sm text-gray-500 text-center">
                    Daily sales for the last 30 days
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  )
}