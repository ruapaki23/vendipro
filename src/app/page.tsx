'use client'

import { useState } from 'react'

export default function VendiPro() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          
          {/* Header */}
          <div className="bg-blue-600 text-white p-6">
            <h1 className="text-3xl font-bold">VendiPro</h1>
            <p className="text-blue-100">Professional Vending Machine Management</p>
          </div>

          {/* Navigation */}
          <div className="border-b bg-gray-50 p-4">
            <div className="flex gap-4">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('machines')}
                className={`px-4 py-2 rounded ${activeTab === 'machines' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
              >
                Machines
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'dashboard' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-100 p-4 rounded">
                    <h3 className="font-bold text-green-800">Total Revenue</h3>
                    <p className="text-2xl text-green-600">$401.80</p>
                  </div>
                  <div className="bg-blue-100 p-4 rounded">
                    <h3 className="font-bold text-blue-800">Your Income</h3>
                    <p className="text-2xl text-blue-600">$118.00</p>
                  </div>
                  <div className="bg-purple-100 p-4 rounded">
                    <h3 className="font-bold text-purple-800">Active Machines</h3>
                    <p className="text-2xl text-purple-600">3</p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'machines' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Machine Management</h2>
                <p className="text-gray-600">Machine features coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}