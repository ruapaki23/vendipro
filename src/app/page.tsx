'use client'

import { useState, useEffect } from 'react'
import { machineOperations, transactionOperations, revenueCalculations, errorHandler, Machine, Transaction } from './database'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, LineChart, Line } from 'recharts'

export default function VendiPro() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [machines, setMachines] = useState<Machine[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMachineId, setEditingMachineId] = useState<number | null>(null)
  const [recordingSaleForMachine, setRecordingSaleForMachine] = useState<number | null>(null)

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

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    
    try {
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
        const { data, error } = await machineOperations.update(machineId, formData)
        if (error) {
          setError(errorHandler.formatError(error))
          return
        }
      } else {
        const { data, error } = await machineOperations.create(formData)
        if (error) {
          setError(errorHandler.formatError(error))
          return
        }
      }
      
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
          
          <div className="bg-blue-600 text-white p-6">
            <h1 className="text-3xl font-bold">VendiPro</h1>
            <p className="text-blue-100">Professional Vending Machine Management - Analytics Dashboard</p>
          </div>

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

          <div className="p-6">
            {activeTab === 'dashboard' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
                
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="font-bold mb-4">Machine Revenue</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={machines.map(machine => ({
                          name: machine.code,
                          yourShare: revenueCalculations.calculateYourShare(machine.revenue, machine.split),
                          partnerShare: revenueCalculations.calculatePartnerShare(machine.revenue, machine.split)
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                          <Bar dataKey="yourShare" fill="#3B82F6" name="Your Share" />
                          <Bar dataKey="partnerShare" fill="#6B7280" name="Partner Share" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="font-bold mb-4">Revenue Split</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Your Income', value: totals.yourIncome, fill: '#3B82F6' },
                              { name: 'Partner Income', value: totals.partnerIncome, fill: '#6B7280' },
                              { name: 'GST Owed', value: totals.gstOwed, fill: '#F59E0B' }
                            ]}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, value }) => `${name}: $${value.toFixed(0)}`}
                          />
                          <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {machines.map(machine => (
                    <div key={machine.id} className="border rounded-lg p-6 bg-gray-50">
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
                              {new Date(transaction.date).toLocaleDateString()}
                              {transaction.description && ` • ${transaction.description}`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">
                              ${transaction.amount.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-8 rounded-lg text-center">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No Sales Recorded Yet</h3>
                    <p className="text-gray-600">Start recording sales from the Machines tab.</p>
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