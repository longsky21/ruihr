import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../lib/api';
import { MapPin, CheckCircle, AlertCircle, RefreshCw, Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '../../lib/utils';

interface Location {
  latitude: number;
  longitude: number;
}

interface AttendanceRecord {
  id: number;
  punch_time: string;
  location: string;
  source: string;
  is_valid: boolean;
}

export default function ClockIn() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'clock' | 'stats'>('clock');
  
  // Clock state
  const [location, setLocation] = useState<Location | null>(null);
  const [officeLocation, setOfficeLocation] = useState<{name: string, distance: number, valid: boolean} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Stats state
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    getLocation();
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activeTab === 'stats') {
      fetchRecords();
    }
  }, [activeTab, currentMonth]); // Fetch when month changes

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const d = R * c; // in metres
    return d;
  }

  const checkOfficeLocation = async (lat: number, lon: number) => {
      if (!user) return;
      try {
          const empRes = await api.get('/employees');
          const myEmployee = empRes.data.find((e: any) => e.user_id === user.id);
          
          if (myEmployee && myEmployee.office_location) {
              const office = myEmployee.office_location;
              const distance = calculateDistance(lat, lon, office.latitude, office.longitude);
              const isValid = distance <= office.radius;
              
              setOfficeLocation({
                  name: office.name,
                  distance: distance,
                  valid: isValid
              });
              
              if (!isValid) {
                  setError(`未进入考勤范围 (${office.name})`);
              }
          } else {
              // No office location assigned, assume valid or handle differently
              // For now, let's assume valid if no location assigned
              setOfficeLocation({
                  name: '未知区域',
                  distance: 0,
                  valid: true
              });
          }
      } catch (err) {
          console.error(err);
      }
  }

  const getLocation = () => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError('浏览器不支持地理定位');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLocation({
          latitude: lat,
          longitude: lon,
        });
        checkOfficeLocation(lat, lon);
        setLoading(false);
      },
      (err) => {
        setError('无法获取您的位置');
        setLoading(false);
      }
    );
  };

  const getClockType = () => {
    const hour = currentTime.getHours();
    return hour < 12 ? '上班打卡' : '下班打卡';
  };

  const fetchRecords = async () => {
    if (!user) return;
    try {
      setLoadingStats(true);
      const empRes = await api.get('/employees');
      const myEmployee = empRes.data.find((e: any) => e.user_id === user.id);
      
      if (myEmployee) {
        // Fetch all records for now (in real app, filter by month)
        const res = await api.get(`/employees/${myEmployee.id}/attendance?limit=100`);
        setRecords(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleClockIn = async () => {
    if (!location || !user || loading || success) return;
    
    // Check validity
    if (officeLocation && !officeLocation.valid) {
        // Can still clock in but it will be invalid, or maybe prevent it?
        // User requirement: "开启定位未在有效打卡区域，按钮绿色可以打卡，但记录无效"
        // So we proceed, but mark as invalid or valid=false in backend? 
        // Backend models.AttendanceRecord has is_valid field.
        // Let's assume we proceed.
    }

    try {
      setLoading(true);
      setError(null);
      
      const empRes = await api.get('/employees');
      const myEmployee = empRes.data.find((e: any) => e.user_id === user.id);
      
      if (!myEmployee) {
           setError('未找到员工记录，请联系人事管理员');
           setLoading(false);
           return;
      }
      const employeeId = myEmployee.id;

      await api.post(`/employees/${employeeId}/attendance`, {
        employee_id: employeeId,
        punch_time: new Date().toISOString(),
        location: `${location.latitude}, ${location.longitude}`,
        device_id: navigator.userAgent, 
        device_name: 'Mobile Web',
        wifi_name: '',
        source: 'H5',
        source_description: 'H5',
        is_valid: officeLocation ? officeLocation.valid : true
      });

      setSuccess(`已成功${getClockType()} ${format(new Date(), 'HH:mm:ss')}`);
      // Refresh stats if we clocked in
      if (activeTab === 'stats') fetchRecords();
    } catch (err) {
      console.error(err);
      setError('打卡失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // Calendar Logic
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getDayRecords = (date: Date) => {
    return records.filter(record => isSameDay(new Date(record.punch_time), date));
  };

  const selectedDayRecords = getDayRecords(selectedDate);

  // Padding days for start of month
  const startDay = getDay(startOfMonth(currentMonth)); // 0 = Sunday
  const paddingDays = Array(startDay === 0 ? 6 : startDay - 1).fill(null); // Adjust for Monday start if needed. Let's assume Sunday start (0) for now or adjust logic.
  // Actually standard calendar usually starts Sunday(0) or Monday(1). Let's use Sunday start for simplicity in rendering grid
  
  // Let's standardise on Monday start (1) - Sunday end (0)
  // 0(Sun), 1(Mon), 2(Tue)...
  // If we want Mon start: 1->0, 2->1 ... 0->6
  const paddingCount = (getDay(startOfMonth(currentMonth)) + 6) % 7; 
  const paddingArray = Array(paddingCount).fill(null);


  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Custom Header with Tabs */}
      <div className="bg-white shadow-sm pt-4 pb-2 px-4 sticky top-0 z-10">
        <div className="flex bg-gray-100 p-1 rounded-xl mb-2">
            <button
                onClick={() => setActiveTab('clock')}
                className={cn(
                    "flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center",
                    activeTab === 'clock' 
                    ? "bg-white text-primary shadow-sm" 
                    : "text-gray-500 hover:text-gray-700"
                )}
            >
                <Clock size={16} className="mr-1.5" />
                考勤打卡
            </button>
            <button
                onClick={() => setActiveTab('stats')}
                className={cn(
                    "flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center",
                    activeTab === 'stats' 
                    ? "bg-white text-primary shadow-sm" 
                    : "text-gray-500 hover:text-gray-700"
                )}
            >
                <CalendarIcon size={16} className="mr-1.5" />
                考勤统计
            </button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'clock' ? (
            <div className="flex flex-col items-center justify-center h-full space-y-8 animate-fade-in py-10">
            {/* Clock Button Circle */}
            <div 
                onClick={handleClockIn}
                className={cn(
                    "w-64 h-64 rounded-full flex flex-col items-center justify-center relative transition-all duration-500 transform select-none shadow-2xl active:scale-95 cursor-pointer border-[8px]",
                    success 
                        ? "bg-gradient-to-br from-green-400 to-green-600 shadow-green-500/40 border-green-100/30" 
                        : (!location || loading) 
                            ? "bg-gray-200 border-gray-300 cursor-not-allowed shadow-none" 
                            : (officeLocation && !officeLocation.valid)
                                ? "bg-gradient-to-br from-green-400 to-green-600 shadow-green-500/40 border-green-100/30" // Green for invalid location but possible to punch
                                : "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/40 border-blue-100/30 hover:shadow-blue-500/60"
                )}
            >
                {loading ? (
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-gray-400 mb-2"></div>
                ) : success ? (
                    <div className="bg-white/20 p-3 rounded-full mb-2 backdrop-blur-sm">
                        <CheckCircle size={40} className="text-white" />
                    </div>
                ) : (
                    <div className={cn(
                        "text-lg font-medium mb-1 tracking-wider px-3 py-0.5 rounded-full backdrop-blur-sm",
                        (!location || loading) ? "text-gray-500 bg-gray-300/50" : "text-white/90 bg-white/10"
                    )}>
                        {getClockType()}
                    </div>
                )}
                
                <div className={cn(
                    "text-5xl font-bold tabular-nums tracking-tighter drop-shadow-sm font-sans my-2",
                    (!location || loading) ? "text-gray-500" : "text-white"
                )}>
                    {format(currentTime, 'HH:mm:ss')}
                </div>
                
                <div className={cn(
                    "text-sm font-medium tracking-wide",
                    (!location || loading) ? "text-gray-500 opacity-100" : "text-white opacity-90"
                )}>
                    {format(currentTime, 'M月d日 EEEE', { locale: zhCN })}
                </div>

                 <div className={cn(
                    "absolute bottom-8 text-xs font-medium tracking-widest uppercase opacity-0 transform translate-y-2 transition-all duration-500 delay-100",
                    !loading && location && !success && "opacity-100 translate-y-0 animate-pulse text-white/60"
                )}>
                    {officeLocation && !officeLocation.valid ? '外勤打卡' : '点击打卡'}
                </div>
                
                {success && (
                    <div className="absolute bottom-8 text-sm font-bold text-white tracking-widest animate-fade-in-up">
                        打卡成功
                    </div>
                )}
                
                {(!location && !loading && !success) && (
                     <div className="absolute bottom-8 text-xs font-medium text-gray-500 tracking-wider">
                        等待定位...
                    </div>
                )}
            </div>

            {/* Location Status */}
            <div className="w-full max-w-sm bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 flex items-center">
                        <MapPin size={16} className="mr-2 text-blue-500" />
                        当前位置
                    </span>
                    <button onClick={getLocation} className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded-full transition-colors">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
                
                {location ? (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-center space-x-2">
                         <div className="w-2 h-2 rounded-full bg-green-500"></div>
                         <span className="truncate">已定位: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</span>
                    </div>
                ) : (
                    <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 flex items-center justify-center">
                        <AlertCircle size={16} className="mr-2" />
                        {error || '正在获取定位...'}
                    </div>
                )}
            </div>

            {/* Success Message Toast */}
            {success && (
                <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg text-sm flex items-center animate-fade-in-up z-50">
                    <CheckCircle size={16} className="mr-2 text-green-400" />
                    {success}
                </div>
            )}
            
            {/* Error Message Toast */}
            {error && !location && (
                <div className="text-center text-sm text-red-500 mt-2 bg-white px-4 py-2 rounded-full shadow-sm">
                    请开启定位权限以进行打卡
                </div>
            )}
            </div>
        ) : (
            <div className="animate-fade-in space-y-4">
                {/* Calendar View */}
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-gray-800 text-lg">
                            {format(currentMonth, 'yyyy年MM月', { locale: zhCN })}
                        </h2>
                        <div className="flex space-x-2">
                             <button onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="p-1 hover:bg-gray-100 rounded-full">
                                <ChevronLeft size={20} className="text-gray-500" />
                             </button>
                             <button onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="p-1 hover:bg-gray-100 rounded-full">
                                <ChevronRight size={20} className="text-gray-500" />
                             </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['一', '二', '三', '四', '五', '六', '日'].map(day => (
                            <div key={day} className="text-xs text-gray-400 font-medium py-1">{day}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {paddingArray.map((_, i) => <div key={`pad-${i}`} />)}
                        {daysInMonth.map((day) => {
                            const dayRecs = getDayRecords(day);
                            const hasRecord = dayRecs.length > 0;
                            const isSelected = isSameDay(day, selectedDate);
                            const isTodayDate = isToday(day);

                            return (
                                <button
                                    key={day.toISOString()}
                                    onClick={() => setSelectedDate(day)}
                                    className={cn(
                                        "aspect-square flex flex-col items-center justify-center rounded-lg relative transition-all",
                                        isSelected ? "bg-primary text-white shadow-md" : "hover:bg-gray-50 text-gray-700",
                                        isTodayDate && !isSelected && "text-primary font-bold"
                                    )}
                                >
                                    <span className="text-sm">{format(day, 'd')}</span>
                                    {hasRecord && (
                                        <div className={cn(
                                            "w-1.5 h-1.5 rounded-full mt-1",
                                            isSelected ? "bg-white" : "bg-green-500"
                                        )} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Selected Date Records */}
                <div className="bg-white rounded-xl shadow-sm p-4 min-h-[200px]">
                    <h3 className="text-sm font-semibold text-gray-500 mb-3">
                        {format(selectedDate, 'yyyy年MM月dd日', { locale: zhCN })} 打卡记录
                    </h3>
                    
                    {selectedDayRecords.length > 0 ? (
                        <div className="space-y-4">
                            {selectedDayRecords.map((record) => (
                                <div key={record.id} className="relative pl-6 pb-2 border-l-2 border-gray-100 last:border-0">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg -mt-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-gray-800 text-lg">
                                                {format(new Date(record.punch_time), 'HH:mm')}
                                            </span>
                                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                                {new Date(record.punch_time).getHours() < 12 ? '上班' : '下班'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 flex items-center">
                                            <MapPin size={12} className="mr-1" />
                                            {record.location}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                            <Clock size={32} className="mb-2 opacity-20" />
                            <p className="text-sm">当日暂无打卡记录</p>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
