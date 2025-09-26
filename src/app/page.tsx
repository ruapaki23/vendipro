'use client'

import { useState, useEffect } from 'react'
import { machineOperations, transactionOperations, revenueCalculations, errorHandler, Machine, Transaction } from './database'

export default function VendiPro() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [machines, setMachines] = useState<Machine[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMachineId, setEditingMachineId] = useState<number | null>(null)
  const [recordingSaleForMachine, setRecordingSaleForMachine] = useState<number | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    location: '',
    code: '',
    revenue: 0,
    partner: 'Independent',
    split: 0,
    status: 'active'
  })

  const [saleData, setSaleData] = useState({
    amount: 0,
    description: ''
  })

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    
    try {
      // Load machines
      const { data: machineData, error: machineError } = await machineOperations.getAll()
      
      if (machineError) {
        errorHandler.logError('loadMachines', machineError)
        setError(errorHandler.formatError(machineError))
        return
      }
      
      if (machineData && machineData.length > 0) {
        setMachines(machineData)
      } else {
        await initializeSampleData()
      }

      // Load transactions
      const { data: transactionData, error: transactionError } = await transactionOperations.getAll()
      if (transactionData) {
        setTransactions(transactionData)
      }
      
    } catch (err) {
      errorHandler.logError('loadData', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  async function initializeSampleData() {
    try {
      const { data, error } = await machineOperations.initializeSampleData()
      
      if (error) {
        errorHandler.logError('initializeSampleData', error)
        setError(errorHandler.formatError(error))
        return
      }
      
      if (data) {
        setMachines(data)
      }
    } catch (err) {
      errorHandler.logError('initializeSampleData', err)
      setError('Failed to initialize sample data')
    }
  }

  function resetForm() {
    setFormData({
      location: '',
      code: '',
      revenue: 0,
      partner: 'Independent',
      split: 0,
      status: 'active'
    })
    setShowAddForm(false)
    setEditingMachineId(null)
  }

  function resetSaleForm() {
    setSaleData({
      amount: 0,
      description: ''
    })
    setRecordingSaleForMachine(null)
  }

  function startEdit(machine: Machine) {
    setEditingMachineId(machine.id!)
    setFormData({
      location: machine.location,
      code: machine.code,
      revenue: machine.revenue,
      partner: machine.partner,
      split: machine.split,
      status: machine.status
    })
    setShowAddForm(false)
  }

  function startAdd() {
    setEditingMachineId(null)
    setFormData({
      location: '',
      code: '',
      revenue: 0,
      partner: 'Independent',
      split: 0,
      status: 'active'
    })
    setShowAddForm(true)
  }

  function startRecordSale(machine: Machine) {
    setRecordingSaleForMachine(machine.id!)
    setSaleData({
      amount: 0,
      description: ''
    })
  }

  async function handleSubmit(e: React.FormEvent, machineId?: number) {
    e.preventDefault()
    
    try {
      if (machineId) {
        // Update existing machine
        const { data, error } = await machineOperations.update(machineId, formData)
        if (error) {
          setError(errorHandler.formatError(error))
          return
        }
      } else {
        // Create new machine
        const { data, error } = await machineOperations.create(formData)
        if (error) {
          setError(errorHandler.formatError(error))
          return
        }
      }
      
      // Refresh data
      await loadData()
      resetForm()
    } catch (err) {
      setError('Failed to save machine')
    }
  }

  async function handleRecordSale(e: React.FormEvent) {
    e.preventDefault()
    
    if (!recordingSaleForMachine || saleData.amount <= 0) {
      setError('Please enter a valid sale amount')
      return
    }
    
    try {
      const { data, error } = await transactionOperations.recordSale(
        recordingSaleForMachine, 
        saleData.amount, 
        saleData.description
      )
      
      if (error) {
        setError(errorHandler.formatError(error))
        return
      }
      
      // Refresh data to show updated revenue and new transaction
      await loadData()
      resetSaleForm()
    } catch (err) {
      setError('Failed to record sale')
    }
  }

  async function handleDelete(machine: Machine) {
    if (!confirm(`Delete ${machine.location} (${machine.code})?`)) {
      return
    }
    
    try {
      const { error } = await machineOperations.delete(machine.id!)
      if (error) {
        setError(errorHandler.formatError(error))
        return
      }
      
      await loadData()
    } catch (err) {
      setError('Failed to delete machine')
    }
  }

  function renderEditForm(machine: Machine) {
    return (
      <div className="bg-blue-50 p-6 rounded-lg mb-4 border-2 border-blue-200">
        <h3 className="text-lg font-bold mb-4 text-blue-800">
          Edit Machine: {machine.location}
        </h3>
        
        <form onSubmit={(e) => handleSubmit(e, machine.id)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              required
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Auckland Mall"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Machine Code</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value})}
              required
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. AKL001"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Partner</label>
            <input
              type="text"
              value={formData.partner}
              onChange={(e) => setFormData({...formData, partner: e.target.value})}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Coca Cola, Pepsi, Independent, etc."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Partner Split (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.split}
              onChange={(e) => setFormData({...formData, split: parseInt(e.target.value) || 0})}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 70"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Current Revenue</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.revenue}
              onChange={(e) => setFormData({...formData, revenue: parseFloat(e.target.value) || 0})}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 2450.30"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          
          <div className="md:col-span-2 flex gap-4">
            <button 
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Update Machine
            </button>
            <button 
              type="button"
              onClick={resetForm}
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    )
  }

  function renderSaleForm(machine: Machine) {
    const shares = revenueCalculations.calculateTransactionShares(saleData.amount || 0, machine.split)
    
    return (
      <div className="bg-green-50 p-6 rounded-lg mb-4 border-2 border-green-200">
        <h3 className="text-lg font-bold mb-4 text-green-800">
          Record Sale: {machine.location}
        </h3>
        
        <form onSubmit={handleRecordSale} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Sale Amount ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={saleData.amount}
                onChange={(e) => setSaleData({...saleData, amount: parseFloat(e.target.value) || 0})}
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
                placeholder="e.g. 50.00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Description (Optional)</label>
              <input
                type="text"
                value={saleData.description}
                onChange={(e) => setSaleData({...saleData, description: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
                placeholder="e.g. Daily collection, Maintenance sale"
              />
            </div>
          </div>

          {saleData.amount > 0 && (
            <div className="bg-white p-4 rounded border grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Your Share</div>
                <div className="font-bold text-blue-600">${shares.yourShare.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-600">Partner Share</div>
                <div className="font-bold text-gray-600">${shares.partnerShare.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-600">GST (15%)</div>
                <div className="font-bold text-orange-600">${shares.gst.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-600">Your Net</div>
                <div className="font-bold text-green-600">${shares.yourShareAfterGST.toFixed(2)}</div>
              </div>
            </div>
          )}
          
          <div className="flex gap-4">
            <button 
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            >
              Record Sale
            </button>
            <button 
              type="button"
              onClick={resetSaleForm}
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-xl text-blue-600">Loading VendiPro...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">Error Loading VendiPro</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button 
            onClick={() => { setError(null); loadData() }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const totals = revenueCalculations.calculateTotals(machines)

  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          
          {/* Header */}
          <div className="bg-blue-600 text-white p-6">
            <h1 className="text-3xl font-bold">VendiPro</h1>
            <p className="text-blue-100">Professional Vending Machine Management - Sales Recording System</p>
          </div>

          {/* Navigation */}
          <div className="border-b bg-gray-50 p-4">
            <div className="flex gap-4">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-50'}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('machines')}
                className={`px-4 py-2 rounded ${activeTab === 'machines' ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-50'}`}
              >
                Machines
              </button>
              <button 
                onClick={() => setActiveTab('sales')}
                className={`px-4 py-2 rounded ${activeTab === 'sales' ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-50'}`}
              >
                Sales
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'dashboard' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
                
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-green-100 p-4 rounded-lg">
                    <h3 className="font-bold text-green-800">Total Revenue</h3>
                    <p className="text-2xl text-green-600">${totals.totalRevenue.toFixed(2)}</p>
                  </div>
                  <div className="bg-blue-100 p-4 rounded-lg">
                    <h3 className="font-bold text-blue-800">Your Income</h3>
                    <p className="text-2xl text-blue-600">${totals.yourIncome.toFixed(2)}</p>
                  </div>
                  <div className="bg-purple-100 p-4 rounded-lg">
                    <h3 className="font-bold text-purple-800">Active Machines</h3>
                    <p className="text-2xl text-purple-600">{totals.activeMachines}</p>
                  </div>
                  <div className="bg-orange-100 p-4 rounded-lg">
                    <h3 className="font-bold text-orange-800">GST Owed (15%)</h3>
                    <p className="text-2xl text-orange-600">${totals.gstOwed.toFixed(2)}</p>
                  </div>
                </div>

                {/* Machine Overview */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold mb-4">Machine Performance</h3>
                  <div className="space-y-3">
                    {machines.map(machine => {
                      const yourShare = revenueCalculations.calculateYourShare(machine.revenue, machine.split)
                      const partnerShare = revenueCalculations.calculatePartnerShare(machine.revenue, machine.split)
                      
                      return (
                        <div key={machine.id} className="flex justify-between items-center py-3 px-4 bg-white rounded border">
                          <div>
                            <div className="font-medium">{machine.location}</div>
                            <div className="text-sm text-gray-600">{machine.code} • {machine.partner}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">${machine.revenue.toFixed(2)}</div>
                            <div className="text-sm">
                              <span className="text-blue-600">You: ${yourShare.toFixed(2)}</span>
                              <span className="text-gray-400 mx-2">•</span>
                              <span className="text-gray-600">Partner: ${partnerShare.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'machines' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Machine Management</h2>
                  <button 
                    onClick={startAdd}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Add Machine
                  </button>
                </div>

                {/* Add Form */}
                {showAddForm && (
                  <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-bold mb-4">Add New Machine</h3>
                    
                    <form onSubmit={(e) => handleSubmit(e)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Location</label>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                          required
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. Auckland Mall"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Machine Code</label>
                        <input
                          type="text"
                          value={formData.code}
                          onChange={(e) => setFormData({...formData, code: e.target.value})}
                          required
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. AKL001"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Partner</label>
                        <input
                          type="text"
                          value={formData.partner}
                          onChange={(e) => setFormData({...formData, partner: e.target.value})}
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. Coca Cola, Pepsi, Independent, etc."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Partner Split (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.split}
                          onChange={(e) => setFormData({...formData, split: parseInt(e.target.value) || 0})}
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. 70"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Current Revenue</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.revenue}
                          onChange={(e) => setFormData({...formData, revenue: parseFloat(e.target.value) || 0})}
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. 2450.30"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      </div>
                      
                      <div className="md:col-span-2 flex gap-4">
                        <button 
                          type="submit"
                          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                        >
                          Add Machine
                        </button>
                        <button 
                          type="button"
                          onClick={resetForm}
                          className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Machines List with Contextual Forms */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {machines.map(machine => (
                    <div key={machine.id} className="space-y-4">
                      {/* Edit Form */}
                      {editingMachineId === machine.id && renderEditForm(machine)}
                      
                      {/* Sale Form */}
                      {recordingSaleForMachine === machine.id && renderSaleForm(machine)}
                      
                      {/* Machine Card */}
                      <div className="border rounded-lg p-6 bg-gray-50">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold">{machine.location}</h3>
                            <p className="text-gray-600">Code: {machine.code}</p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => startRecordSale(machine)}
                              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                            >
                              Record Sale
                            </button>
                            <button 
                              onClick={() => startEdit(machine)}
                              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(machine)}
                              className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Total Revenue</p>
                            <p className="font-bold text-green-600 text-lg">${machine.revenue.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Your Share</p>
                            <p className="font-bold text-blue-600 text-lg">
                              ${revenueCalculations.calculateYourShare(machine.revenue, machine.split).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Partner</p>
                            <p className="font-medium">{machine.partner}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Split</p>
                            <p className="font-medium">{machine.split}% partner / {100 - machine.split}% you</p>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            machine.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : machine.status === 'maintenance'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {machine.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'sales' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Sales History</h2>
                
                {transactions.length > 0 ? (
                  <div className="bg-white rounded-lg border">
                    <div className="p-4 border-b">
                      <h3 className="font-bold">Recent Transactions</h3>
                    </div>
                    <div className="divide-y">
                      {transactions.slice(0, 10).map((transaction) => (
                        <div key={transaction.id} className="p-4 flex justify-between items-center">
                          <div>
                            <div className="font-medium">
                              {transaction.machines?.location || 'Unknown Machine'}
                            </div>
                            <div className="text-sm text-gray-600">
                              {new Date(transaction.date).toLocaleDateString()} • {transaction.type}
                              {transaction.description && ` • ${transaction.description}`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">
                              ${transaction.amount.toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {new Date(transaction.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-8 rounded-lg text-center">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No Sales Recorded Yet</h3>
                    <p className="text-gray-600">Start recording sales from the Machines tab to see transaction history here.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}