import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useLocationStore } from '../../store/useLocationStore';
import api from '../../lib/api';
import { MapPin, CheckCircle, AlertCircle, RefreshCw, Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '../../lib/utils';

interface Location {
  latitude: number;
  longitude: number;
}

interface OfficeLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
}

interface AttendanceRecord {
  id: number;
  punch_time: string;
  location: string;
  source: string;
  is_valid: boolean;
  source_description: string;
  device_name: string;
  created_at: string;
}

export default function ClockIn() {
  const { user } = useAuthStore();
  const locationStore = useLocationStore();
  const [activeTab, setActiveTab] = useState<'clock' | 'stats'>('clock');
  
  // Clock state
  const [location, setLocation] = useState<Location | null>(locationStore.location);
  const [officeLocation, setOfficeLocation] = useState<OfficeLocation | null>(locationStore.officeLocation);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ message: string; time: string; status: string; location: string } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const [isInRange, setIsInRange] = useState<boolean | null>(locationStore.isInRange);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [employeeInfo, setEmployeeInfo] = useState<any>(null);
  const [fetchingEmployee, setFetchingEmployee] = useState(false);
  
  // Stats state
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarExpanded, setCalendarExpanded] = useState(false);

  // 定时更新当前时间
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    checkLocationPermission();
    return () => clearInterval(timer);
  }, []);

  // 切换到统计标签时获取记录
  useEffect(() => {
    if (activeTab === 'stats') {
      fetchRecords();
    }
  }, [activeTab, currentMonth]);

  // 检查定位权限状态
  const checkLocationPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      setPermissionStatus('denied');
      setError('浏览器不支持地理定位');
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        setPermissionStatus(permission.state as 'granted' | 'denied' | 'prompt');
        
        permission.onchange = () => {
          setPermissionStatus(permission.state as 'granted' | 'denied' | 'prompt');
          if (permission.state === 'granted') {
            getLocation();
          }
        };
      } catch (err) {
        console.error('Error checking location permission:', err);
        setPermissionStatus('unknown');
      }
    } else {
      // 浏览器不支持 permissions API，直接尝试获取位置
      setPermissionStatus('unknown');
      getLocation();
    }
  }, []);

  // 计算两点之间的距离（米）
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // 地球半径（米）
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const d = R * c;
    return d;
  };

  // 获取当前员工信息
  const getCurrentEmployee = async () => {
    if (!user) return null;
    
    try {
      setFetchingEmployee(true);
      const response = await api.get('/users/me');
      const employee = response.data;
      setEmployeeInfo(employee);
      setEmployeeId(employee.id);
      
      // 提取办公地点信息
      if (employee.department && employee.department.office_location) {
        setOfficeLocation(employee.department.office_location);
      }
      
      return employee;
    } catch (err) {
      console.error('Error getting current employee:', err);
      return null;
    } finally {
      setFetchingEmployee(false);
    }
  };

  // 检查是否在有效打卡范围内
  const checkOfficeLocation = async (lat: number, lon: number) => {
    if (!user || !employeeInfo) return;
    
    try {
      if (employeeInfo.department && employeeInfo.department.office_location) {
        const office = employeeInfo.department.office_location;
        setOfficeLocation(office);
        locationStore.setOfficeLocation(office);
        const distance = calculateDistance(lat, lon, office.latitude, office.longitude);
        const inRange = distance <= office.radius;
        setIsInRange(inRange);
        locationStore.setIsInRange(inRange);
        
        if (!inRange) {
          setError(`未进入考勤范围 (${office.name})`);
        } else {
          setError(null);
        }
      } else {
        setError('未找到办公地点信息');
        setIsInRange(null);
        locationStore.setIsInRange(null);
      }
    } catch (err) {
      console.error('Error checking office location:', err);
      setError('获取办公地点信息失败');
      setIsInRange(null);
      locationStore.setIsInRange(null);
    }
  };

  // 获取当前位置
  const getLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('浏览器不支持地理定位');
      setPermissionStatus('denied');
      return;
    }

    setIsCheckingLocation(true);
    setError(null);

    // 先获取员工信息
    if (!employeeInfo && user) {
      await getCurrentEmployee();
    }

    // 设置10秒超时
    const timeoutId = setTimeout(() => {
      setError('获取位置信息失败，请稍后重试');
      setIsCheckingLocation(false);
    }, 10000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(timeoutId);
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const newLocation = { latitude: lat, longitude: lon };
        setLocation(newLocation);
        locationStore.setLocation(newLocation);
        
        // 确保员工信息已获取
        if (!employeeInfo && user) {
          await getCurrentEmployee();
        }
        
        checkOfficeLocation(lat, lon);
        setIsCheckingLocation(false);
        setPermissionStatus('granted');
      },
      (err) => {
        clearTimeout(timeoutId);
        setError('无法获取您的位置');
        setIsCheckingLocation(false);
        
        if (err.code === 1) {
          setPermissionStatus('denied');
        }
      }
    );
  }, [employeeInfo, user]);

  // 初始化获取员工信息
  useEffect(() => {
    if (user && !employeeInfo) {
      getCurrentEmployee();
    }
  }, [user, employeeInfo]);

  // 判断是上班还是下班打卡
  const getClockType = () => {
    const hour = currentTime.getHours();
    return hour < 12 ? '上班打卡' : '下班打卡';
  };

  // 获取打卡记录
  const fetchRecords = async () => {
    if (!user || !employeeId) return;
    try {
      setLoadingStats(true);
      const res = await api.get(`/attendance/records?employee_id=${employeeId}&limit=100`);
      setRecords(res.data);
    } catch (err) {
      console.error('Error fetching records:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // 处理打卡操作
  const handleClockIn = async () => {
    if (!location || !user || loading || success) return;
    
    // 检查权限状态
    if (permissionStatus !== 'granted') {
      setError('请开启定位权限以使用打卡功能');
      return;
    }

    try {
      // 确保有员工信息
      let currentEmployee = employeeInfo;
      let currentEmployeeId = employeeId;
      
      if (!currentEmployee) {
        currentEmployee = await getCurrentEmployee();
        if (!currentEmployee) {
          setError('未找到员工记录，请联系人事管理员');
          return;
        }
        currentEmployeeId = currentEmployee.id;
      }

      setLoading(true);
      setError(null);
      
      const now = new Date();
      // 转换为本地时间的ISO格式（北京时间）
      const nowISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString();
      
      // 检查是否在有效范围内
      let is_valid = true;
      let officeName = '未知地点';
      
      if (currentEmployee.department && currentEmployee.department.office_location) {
        const office = currentEmployee.department.office_location;
        const distance = calculateDistance(location.latitude, location.longitude, office.latitude, office.longitude);
        is_valid = distance <= office.radius;
        officeName = office.name;
      }

      // 直接提交打卡请求到考勤记录表
      const response = await api.post('/attendance/records', {
        employee_id: currentEmployeeId,
        punch_time: nowISO,
        location: `${location.latitude}, ${location.longitude}`,
        source: 'H5',
        source_description: 'Mobile Web',
        is_valid: is_valid,
        device_id: navigator.userAgent,
        device_name: 'Mobile Web',
        wifi_name: ''
      });

      // 判断打卡类型
      const punchType = now.getHours() < 12 ? '上班' : '下班';
      
      // 播放语音提示
      try {
        const utterance = new SpeechSynthesisUtterance(`${punchType}打卡成功`);
        utterance.lang = 'zh-CN';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.log('语音播报失败', err);
      }

      // 显示成功反馈
      setSuccess({
        message: `${punchType}打卡成功`,
        time: format(now, 'YYYY-MM-DD HH:mm:ss'),
        status: is_valid ? '有效打卡' : '无效打卡',
        location: officeName
      });

      // 刷新记录
      if (activeTab === 'stats') {
        fetchRecords();
      }

      // 3秒后自动关闭成功提示
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error clocking in:', err);
      setError('打卡失败，请重试');
      
      // 网络异常处理
      if (!navigator.onLine) {
        setError('网络异常，请检查网络连接后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  // 日历逻辑
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getDayRecords = (date: Date) => {
    return records.filter(record => isSameDay(new Date(record.punch_time), date));
  };

  const selectedDayRecords = getDayRecords(selectedDate);

  // 计算月份开始的 padding 天数
  const paddingCount = (getDay(startOfMonth(currentMonth)) + 6) % 7;
  const paddingArray = Array(paddingCount).fill(null);

  // 计算当前日期所在周的起止位置（用于收缩显示）
  const today = new Date();
  const currentWeekStart = new Date(today);
  const dayOfWeek = getDay(today);
  currentWeekStart.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6);

  // 判断日期是否在当前周
  const isInCurrentWeek = (date: Date) => {
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    const start = new Date(currentWeekStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(currentWeekEnd);
    end.setHours(23, 59, 59, 999);
    return compareDate >= start && compareDate <= end;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* 自定义头部标签 */}
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
            {/* 打卡按钮圆形 */}
            <div 
                onClick={handleClockIn}
                className={cn(
                    "w-64 h-64 rounded-full flex flex-col items-center justify-center relative transition-all duration-500 transform select-none shadow-2xl active:scale-95 cursor-pointer border-[8px]",
                    success 
                        ? "bg-gradient-to-br from-green-400 to-green-600 shadow-green-500/40 border-green-100/30" 
                        : (permissionStatus !== 'granted' || loading || !location || fetchingEmployee || isInRange === null) 
                            ? "bg-gray-200 border-gray-300 cursor-not-allowed shadow-none" 
                            : isInRange === false
                                ? "bg-gradient-to-br from-green-400 to-green-600 shadow-green-500/40 border-green-100/30" // 淡绿色主题
                                : "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/40 border-blue-100/30 hover:shadow-blue-500/60" // 蓝色主题
                )}
            >
                {loading || fetchingEmployee ? (
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-gray-400 absolute top-16"></div>
                ) : success ? (
                    <div className="bg-white/20 p-3 rounded-full absolute top-16 backdrop-blur-sm">
                        <CheckCircle size={40} className="text-white" />
                    </div>
                ) : (
                    <div className={cn(
                        "text-lg font-medium tracking-wider px-3 py-0.5 rounded-full backdrop-blur-sm absolute top-10",
                        (permissionStatus !== 'granted' || loading || !location || fetchingEmployee) ? "text-gray-500 bg-gray-300/50" : "text-white/90 bg-white/10"
                    )}>
                        {getClockType()}
                    </div>
                )}
                
                <div className={cn(
                    "text-[2.6rem] font-bold tabular-nums tracking-tighter drop-shadow-sm font-sans absolute top-1/2 -translate-y-1/2",
                    (permissionStatus !== 'granted' || loading || !location || fetchingEmployee) ? "text-gray-500" : "text-white"
                )}>
                    {format(currentTime, 'HH:mm:ss')}
                </div>
                
                <div className={cn(
                    "text-sm font-medium tracking-wide absolute bottom-14",
                    (permissionStatus !== 'granted' || loading || !location || fetchingEmployee) ? "text-gray-500 opacity-100" : "text-white opacity-90"
                )}>
                    {format(currentTime, 'M月d日 EEEE', { locale: zhCN })}
                </div>

                 <div className={cn(
                    "absolute bottom-8 text-xs font-bold tracking-widest uppercase opacity-0 transform translate-y-2 transition-all duration-500",
                    !loading && !fetchingEmployee && permissionStatus === 'granted' && !success && location && isInRange !== null && "opacity-100 translate-y-0 animate-pulse text-white font-semibold"
                )}>
                    {isInRange === false ? '外勤打卡' : '点击打卡'}
                </div>
                
                {success && (
                    <div className="absolute bottom-8 text-sm font-bold text-white tracking-widest animate-fade-in-up">
                        打卡成功
                    </div>
                )}
                
                {(!location && !loading && !fetchingEmployee && !success) && (
                     <div className="absolute bottom-8 text-xs font-medium text-gray-500 tracking-wider">
                        等待定位...
                    </div>
                )}
                
                {fetchingEmployee && (
                    <div className="absolute bottom-8 text-xs font-medium text-gray-500 tracking-wider">
                        加载员工信息...
                    </div>
                )}
            </div>

            {/* 位置状态 */}
            <div className="w-full max-w-sm bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 flex items-center">
                        <MapPin size={16} className="mr-2 text-blue-500" />
                        当前位置
                    </span>
                    <button 
                        onClick={getLocation} 
                        className={cn(
                            "text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded-full transition-colors",
                            (isCheckingLocation || fetchingEmployee) && "animate-spin"
                        )}
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
                
                {permissionStatus === 'denied' ? (
                    <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 flex items-center">
                        <AlertCircle size={16} className="mr-2" />
                        <div>
                            <p>请开启定位权限以使用打卡功能</p>
                            <button 
                                className="text-blue-500 text-xs mt-1"
                                onClick={() => {
                                    // 引导用户前往系统设置
                                    if (window.location.href.includes('http')) {
                                        // 在Web环境中提示用户
                                        alert('请在浏览器设置中开启定位权限');
                                    }
                                }}
                            >
                                前往设置
                            </button>
                        </div>
                    </div>
                ) : location ? (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-center space-x-2">
                         <div className={cn(
                            "w-2 h-2 rounded-full",
                             isInRange === false ? "bg-red-300" : "bg-green-500"
                         )}></div>
                         <span className="truncate">
                            {isInRange === true 
                                ? `已定位：${officeLocation?.name || '未知地点'}`
                                : isInRange === false 
                                    ? `已定位：不在 ${officeLocation?.name || '未知地点'} 区域内`
                                    : `已定位：${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                         </span>
                    </div>
                ) : (
                    <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 flex items-center justify-center">
                        <AlertCircle size={16} className="mr-2" />
                        {error || '正在获取定位...'}
                    </div>
                )}
            </div>



            {/* 成功消息卡片 */}
            {success && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full mx-4 animate-scale-in">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                                <CheckCircle size={32} className="text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">{success.message}</h3>
                        </div>
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between">
                                <span className="text-gray-500">打卡时间</span>
                                <span className="font-medium">{success.time}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">打卡状态</span>
                                <span className={cn(
                                    "font-medium px-2 py-0.5 rounded-full text-xs",
                                    success.status === '有效打卡' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                )}>
                                    {success.status}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">办公地点</span>
                                <span className="font-medium">{success.location}</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setSuccess(null)}
                            className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                        >
                            确定
                        </button>
                    </div>
                </div>
            )}
            </div>
        ) : (
            <div className="animate-fade-in space-y-4">
                {/* 日历视图 */}
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
                        {paddingArray.map((_, i) => {
                            if (!calendarExpanded) {
                                const paddingDate = new Date(currentMonth);
                                paddingDate.setDate(1 - (paddingCount - i));
                                if (isInCurrentWeek(paddingDate)) {
                                    return <div key={`pad-${i}`} className="aspect-square" />;
                                }
                                return <div key={`pad-${i}`} />;
                            }
                            return <div key={`pad-${i}`} />;
                        })}
                        {daysInMonth.map((day, dayIndex) => {
                            const dayRecs = getDayRecords(day);
                            const isSelected = isSameDay(day, selectedDate);
                            const isTodayDate = isToday(day);
                            const isFuture = day > today;
                            
                            if (!calendarExpanded && !isInCurrentWeek(day)) {
                                return <div key={day.toISOString()} />;
                            }

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
                                    {!isFuture && (
                                        <div className="flex space-x-1 mt-1">
                                            <div className={cn(
                                                "w-1.5 h-1.5 rounded-full",
                                                isSelected ? "bg-white" : dayRecs.some(r => {
                                                    const hour = new Date(r.punch_time).getHours();
                                                    return hour < 12;
                                                }) ? (
                                                    dayRecs.some(r => {
                                                        const hour = new Date(r.punch_time).getHours();
                                                        return hour < 12 && !r.is_valid;
                                                    }) ? "bg-red-300" : "bg-green-500"
                                                ) : "bg-gray-300"
                                            )} />
                                            <div className={cn(
                                                "w-1.5 h-1.5 rounded-full",
                                                isSelected ? "bg-white" : dayRecs.some(r => {
                                                    const hour = new Date(r.punch_time).getHours();
                                                    return hour >= 12;
                                                }) ? (
                                                    dayRecs.some(r => {
                                                        const hour = new Date(r.punch_time).getHours();
                                                        return hour >= 12 && !r.is_valid;
                                                    }) ? "bg-red-300" : "bg-green-500"
                                                ) : "bg-gray-300"
                                            )} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    
                    <div className="flex justify-center mt-4">
                        <button 
                            onClick={() => setCalendarExpanded(!calendarExpanded)}
                            className="px-4 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors flex items-center"
                        >
                            {calendarExpanded ? (
                                <>
                                    收起
                                    <ChevronRight size={16} className="ml-1 transform -rotate-90" />
                                </>
                            ) : (
                                <>
                                    展开
                                    <ChevronRight size={16} className="ml-1 transform rotate-90" />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* 选中日期的记录 */}
                <div className="bg-white rounded-xl shadow-sm p-4 min-h-[200px]">
                    <h3 className="text-sm font-semibold text-gray-500 mb-3">
                        {format(selectedDate, 'yyyy年MM月dd日', { locale: zhCN })} 打卡记录
                    </h3>
                    
                    {loadingStats ? (
                        <div className="flex justify-center items-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
                        </div>
                    ) : selectedDayRecords.length > 0 ? (
                        <div className="space-y-4">
                            {selectedDayRecords.map((record) => {
                                const hour = new Date(record.punch_time).getHours();
                                const punchType = hour < 12 ? '上班' : '下班';
                                return (
                                    <div key={record.id} className="relative pl-6 pb-2 border-l-2 border-gray-100 last:border-0">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg -mt-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-800 text-lg">
                                                        {format(new Date(record.punch_time), 'HH:mm')}
                                                    </span>
                                                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                                        {punchType}
                                                    </span>
                                                </div>
                                                <span className={cn(
                                                    "text-xs px-2 py-0.5 rounded-full",
                                                    record.is_valid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                )}>
                                                    {record.is_valid ? '有效' : '无效'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 flex items-center">
                                                <MapPin size={12} className="mr-1" />
                                                {employeeInfo?.department?.office_location?.name || '未知地点'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
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