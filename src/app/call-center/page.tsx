'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { HeaderBar } from '@/components/dashboard/HeaderBar';
import { FiltersBar } from '@/components/dashboard/FiltersBar';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { FunnelChart } from '@/components/dashboard/FunnelChart';
import { PieChart } from '@/components/dashboard/PieChart';
import { LineChart } from '@/components/dashboard/LineChart';
import { HangupReasons } from '@/components/dashboard/HangupReasons';
import { 
  Phone, 
  PhoneOutgoing, 
  PhoneIncoming, 
  Globe, 
  Users, 
  Bot, 
  Triangle, 
  Network, 
  Calendar, 
  Clock, 
  BarChart3, 
  DollarSign,
  CalendarCheck,
  ArrowRightLeft,
  CheckSquare,
  Mic,
  Heart
} from 'lucide-react';

export default function CallCenterPage(): React.ReactNode {
  const [activeTab, setActiveTab] = useState<'data-center' | 'call-list'>('data-center');

  // Datos del embudo
  const funnelSteps = [
    {
      label: 'Dials',
      value: 1,
      percentage: 100,
      color: 'bg-purplebg-background0'
    },
    {
      label: 'Answers',
      value: 1,
      percentage: 100,
      color: 'bg-purplebg-background0'
    },
    {
      label: 'Conversations',
      value: 0,
      percentage: 0,
      color: 'bg-yellowbg-background0'
    },
    {
      label: 'Appointments',
      value: 0,
      percentage: 0,
      color: 'bg-orangebg-background0'
    }
  ];

  // Datos para Contact Sentiment (gráfico de pastel)
  const sentimentData = [
    {
      label: 'Negative',
      value: 1,
      color: '#ef4444' // rojo
    }
  ];

  // Datos para Call Volume (gráfico de línea)
  const callVolumeData = [
    { date: '10/10/25', value: 1 }
  ];

  // Datos para Call Minutes (gráfico de línea)
  const callMinutesData = [
    { date: '10/10/25', value: 0 }
  ];

  // Datos para Hangup Reasons (vacío como en la imagen)
  const hangupReasonsData: any[] = [];

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <HeaderBar title="Call Center" />
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-card">
          <button
            onClick={() => setActiveTab('data-center')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'data-center'
                ? 'border-primary text-primary'
                : 'border-transparent text-graybg-background0 hover:text-gray-700'
            }`}
          >
            Data Center
          </button>
          <button
            onClick={() => setActiveTab('call-list')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'call-list'
                ? 'border-primary text-primary'
                : 'border-transparent text-graybg-background0 hover:text-gray-700'
            }`}
          >
            Call List
          </button>
        </div>

        {activeTab === 'data-center' && (
          <>
            {/* Filters */}
            <FiltersBar />
            
            {/* Content */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              {/* Metric Cards */}
              <div className="space-y-6">
                {/* Primera fila */}
                <div className="grid grid-cols-5 gap-4">
                  <MetricCard
                    icon={<Phone className="w-6 h-6" />}
                    title="Total Calls"
                    value="1"
                    color="purple"
                  />
                  <MetricCard
                    icon={<PhoneOutgoing className="w-6 h-6" />}
                    title="Outbound Calls"
                    value="0"
                    color="green"
                  />
                  <MetricCard
                    icon={<PhoneIncoming className="w-6 h-6" />}
                    title="Inbound Calls"
                    value="1"
                    color="blue"
                  />
                  <MetricCard
                    icon={<Globe className="w-6 h-6" />}
                    title="Web Calls"
                    value="0"
                    color="yellow"
                  />
                  <MetricCard
                    icon={<Phone className="w-6 h-6" />}
                    title="Cost Per Dial"
                    value="$0.03"
                    color="brown"
                  />
                </div>

                {/* Segunda fila */}
                <div className="grid grid-cols-5 gap-4">
                  <MetricCard
                    icon={<Phone className="w-6 h-6" />}
                    title="Cost Per Minute"
                    value="$0.00"
                    color="purple"
                  />
                  <MetricCard
                    icon={<Clock className="w-6 h-6" />}
                    title="Avg Call Duration"
                    value="0 mins"
                    color="green"
                  />
                  <MetricCard
                    icon={<Clock className="w-6 h-6" />}
                    title="Avg Hold Time"
                    value="0 mins"
                    color="blue"
                  />
                  <MetricCard
                    icon={<CalendarCheck className="w-6 h-6" />}
                    title="Cost Per Booked Appointment"
                    value=""
                    color="yellow"
                  />
                  <MetricCard
                    icon={<ArrowRightLeft className="w-6 h-6" />}
                    title="Cost Per Transfer"
                    value=""
                    color="brown"
                  />
                </div>

                {/* Tercera fila */}
                <div className="grid grid-cols-5 gap-4">
                  <MetricCard
                    icon={<Clock className="w-6 h-6" />}
                    title="Total Minutes"
                    value="0 mins"
                    color="purple"
                  />
                  <MetricCard
                    icon={<Users className="w-6 h-6" />}
                    title="Total Conversations"
                    value="0"
                    color="green"
                  />
                  <MetricCard
                    icon={<Calendar className="w-6 h-6" />}
                    title="Total Appointments"
                    value="0"
                    color="blue"
                  />
                  <MetricCard
                    icon={<Network className="w-6 h-6" />}
                    title="Total Transfers"
                    value="0"
                    color="yellow"
                  />
                  <MetricCard
                    icon={<Users className="w-6 h-6" />}
                    title="Total Leads"
                    value="0"
                    color="brown"
                  />
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Funnel Chart - Top Right */}
                <div className="lg:col-span-2">
                  <FunnelChart 
                    title="Appointments"
                    subtitle="Last 30 days"
                    steps={funnelSteps}
                  />
                </div>
                
                {/* Contact Sentiment - Bottom Left */}
                <div className="lg:col-span-1">
                  <PieChart
                    title="Contact Sentiment"
                    subtitle="Last 30 days"
                    data={sentimentData}
                  />
                </div>
              </div>

              {/* Bottom Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Hangup Reasons - Middle Right */}
                <div className="lg:col-span-1">
                  <HangupReasons
                    title="Hangup Reasons"
                    subtitle="Last 30 days"
                    data={hangupReasonsData}
                  />
                </div>
                
                {/* Call Volume - Bottom Left */}
                <div className="lg:col-span-1">
                  <LineChart
                    title="Call Volume"
                    subtitle="Last 30 days"
                    value="1 calls"
                    data={callVolumeData}
                    color="purple"
                    icon={<CheckSquare className="w-4 h-4" />}
                  />
                </div>
                
                {/* Call Minutes - Bottom Right */}
                <div className="lg:col-span-1">
                  <LineChart
                    title="Call Minutes"
                    subtitle="Last 30 days"
                    value="0 mins"
                    data={callMinutesData}
                    color="green"
                    icon={<Mic className="w-4 h-4" />}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'call-list' && (
          <div className="flex-1 p-6">
            <div className="bg-card rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Call List</h3>
              <p className="text-graybg-background0">Call list functionality will be implemented here.</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
