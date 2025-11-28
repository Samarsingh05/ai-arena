"use client"

import { useState } from "react"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts"

type Point = {
  timestamp: string
  leftPercent: number
  tokens: number
}

type Props = {
  data: Point[]
}

export function QuotaChart({ data }: Props) {
  const [isHovered, setIsHovered] = useState(false)
  
  // Always show at least one point at 100%
  const now = new Date().toISOString()
  let chartData: Point[]
  
  if (data.length === 0) {
    // No data - show 100% line
    chartData = [
      { timestamp: new Date(Date.now() - 86400000).toISOString(), leftPercent: 100, tokens: 0 },
      { timestamp: now, leftPercent: 100, tokens: 0 }
    ]
  } else {
    // Add starting point at 100% if not present
    const firstPoint = data[0]
    const startTime = new Date(new Date(firstPoint.timestamp).getTime() - 3600000).toISOString()
    chartData = [
      { timestamp: startTime, leftPercent: 100, tokens: 0 },
      ...data
    ]
  }

  // Format timestamp for X axis
  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem)
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  return (
    <div className="w-full bg-black/88 rounded-2xl p-4 border border-emerald-200/20 shadow-inner">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[12px] font-semibold text-emerald-100 tracking-[0.2em] uppercase">
          Quota usage over time
        </div>
        <span className="text-[11px] text-emerald-300/80">Tokens vs remaining quota</span>
      </div>
      <div className="w-full flex justify-center">
        <div className="w-full max-w-[420px]" style={{ height: "200px" }}>
          <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartData} 
            margin={{ top: 10, right: 15, left: 5, bottom: 30 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#9ae6b4" stopOpacity={1} />
              <stop offset="100%" stopColor="#86efac" stopOpacity={1} />
            </linearGradient>
          </defs>
          
          {/* X Axis - Time (always visible) */}
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={formatXAxis}
            tick={{ fill: "#c4eed7", fontSize: 10, fontWeight: 500 }}
            axisLine={{ stroke: "#0d3020", strokeWidth: 1 }}
            tickLine={{ stroke: "#0d3020", strokeWidth: 1 }}
            label={{ 
              value: "Time", 
              position: "insideBottom", 
              offset: -8, 
              fill: "#8cdcb6", 
              fontSize: 10, 
              fontWeight: 600 
            }}
            interval="preserveStartEnd"
          />
          
          {/* Y Axis - Usage Percentage (always visible) */}
          <YAxis
            domain={[0, 100]}
            tickFormatter={v => `${v}%`}
            tick={{ fill: "#c4eed7", fontSize: 10, fontWeight: 500 }}
            axisLine={{ stroke: "#0d3020", strokeWidth: 1 }}
            tickLine={{ stroke: "#0d3020", strokeWidth: 1 }}
            label={{ 
              value: "Quota Left (%)", 
              angle: -90, 
              position: "insideLeft", 
              fill: "#8cdcb6", 
              fontSize: 10, 
              fontWeight: 600,
              style: { textAnchor: "middle" }
            }}
            width={60}
          />
          
          {/* Grid Lines (always visible) */}
          <CartesianGrid 
            stroke="#0e3b24" 
            strokeDasharray="3 3" 
            strokeOpacity={0.5}
            vertical={false}
          />
          
          {/* Reference Line at 100% */}
          <ReferenceLine 
            y={100} 
            stroke="#2f8b57" 
            strokeDasharray="4 4" 
            strokeOpacity={0.7}
            strokeWidth={2}
            label={{ value: "100%", position: "right", fill: "#c4eed7", fontSize: 10, fontWeight: 600 }}
          />
          
          {/* Tooltip with crosshair */}
          <Tooltip
            contentStyle={{
              backgroundColor: "#020503",
              border: "1px solid rgba(148,210,175,0.3)",
              borderRadius: "12px",
              color: "#d1fae5",
              fontSize: "11px",
              padding: "10px 14px",
              boxShadow: "0 10px 25px rgba(6,95,70,0.35)"
            }}
            cursor={{ 
              stroke: "#9ae6b4", 
              strokeWidth: 1, 
              strokeDasharray: "5 5",
              strokeOpacity: 0.6
            }}
            formatter={(value: any, _name, props: any) => {
              const v = value as number
              return [`${v.toFixed(1)}%`, `Tokens: ${props.payload.tokens.toLocaleString()}`]
            }}
            labelFormatter={label => {
              const date = new Date(label)
              return date.toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
              })
            }}
          />
          
          {/* Line - only visible on hover, connects dots */}
          <Line
            type="monotone"
            dataKey="leftPercent"
            stroke={isHovered ? "url(#lineGradient)" : "#9ae6b4"}
            strokeOpacity={isHovered ? 1 : 0.35}
            strokeWidth={3}
            dot={{ 
              fill: "#c4eed7", 
              r: 4,
              strokeWidth: 2, 
              stroke: "#04180f",
              opacity: 1
            }}
            activeDot={{ 
              r: 5, 
              fill: "#a7f3d0", 
              stroke: "#04180f", 
              strokeWidth: 2 
            }}
            isAnimationActive={false}
          />
          </LineChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
