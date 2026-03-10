import { ref, computed, onUnmounted } from 'vue';
import { DTPWeb, LPA_ParamID } from 'dtpweb';

export interface PrinterStatus {
  device: string;
  online: boolean;
  opened: boolean;
  printable: boolean;
  loading: boolean;
  error?: string;
  lastCheckTime?: Date;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
 type DtpApi = any;

export function usePrinterStatus() {
  const statusMap = ref<Map<string, PrinterStatus>>(new Map());
  const dtpApi = ref<DtpApi | null>(null);
  const isChecking = ref(false);
  const autoRefreshEnabled = ref(false);
  const refreshInterval = ref<number>(10000); // 默认10秒
  let timer: ReturnType<typeof setInterval> | null = null;

  // 计算属性：获取所有状态
  const allStatus = computed(() => Array.from(statusMap.value.values()));

  // 检查 DTPWeb 是否可用
  const checkDtpWeb = async (): Promise<DtpApi | null> => {
    return new Promise((resolve) => {
      const cachedApi = dtpApi.value;
      if (cachedApi) {
        resolve(cachedApi);
        return;
      }

      DTPWeb.checkServer({
        callback: (resp, api: DtpApi) => {
          if (resp?.statusCode === 0 && api) {
            dtpApi.value = api;
            resolve(api);
          } else {
            resolve(null);
          }
        },
      });
    });
  };

  // 检测单个打印机状态
  const checkPrinterStatus = async (device: string): Promise<PrinterStatus> => {
    const api = await checkDtpWeb();
    
    if (!api) {
      return {
        device,
        online: false,
        opened: false,
        printable: false,
        loading: false,
        error: '未检测到德佟打印助手',
        lastCheckTime: new Date(),
      };
    }

    // 设置状态为检测中
    const checkingStatus: PrinterStatus = {
      device,
      online: false,
      opened: false,
      printable: false,
      loading: true,
    };
    statusMap.value.set(device, checkingStatus);

    try {
      // 打开打印机
      const opened = api.openPrinter(device);
      
      if (!opened) {
        const status: PrinterStatus = {
          device,
          online: false,
          opened: false,
          printable: false,
          loading: false,
          error: '无法打开打印机',
          lastCheckTime: new Date(),
        };
        statusMap.value.set(device, status);
        return status;
      }

      // 获取打印机状态
      const isOnline = api.isPrinterOnline ? api.isPrinterOnline() : true;
      const isPrintable = api.getParam(LPA_ParamID.IsPrintable) !== 0;

      // 关闭打印机
      api.closePrinter();

      const status: PrinterStatus = {
        device,
        online: isOnline,
        opened: true,
        printable: isPrintable,
        loading: false,
        lastCheckTime: new Date(),
      };
      statusMap.value.set(device, status);
      return status;
    } catch (error) {
      // 确保关闭打印机
      try {
        api.closePrinter();
      } catch {}

      const status: PrinterStatus = {
        device,
        online: false,
        opened: false,
        printable: false,
        loading: false,
        error: error instanceof Error ? error.message : '检测失败',
        lastCheckTime: new Date(),
      };
      statusMap.value.set(device, status);
      return status;
    }
  };

  // 批量检测打印机状态
  const checkMultiplePrinters = async (devices: string[]) => {
    if (isChecking.value) return;
    
    isChecking.value = true;
    try {
      // 串行检测，避免并发问题
      for (const device of devices) {
        await checkPrinterStatus(device);
      }
    } finally {
      isChecking.value = false;
    }
  };

  // 获取单个打印机状态（从缓存）
  const getStatus = (device: string): PrinterStatus | undefined => {
    return statusMap.value.get(device);
  };

  // 开始自动刷新
  const startAutoRefresh = (devices: string[], intervalMs?: number) => {
    stopAutoRefresh();
    
    if (intervalMs) {
      refreshInterval.value = intervalMs;
    }
    
    autoRefreshEnabled.value = true;
    
    // 立即执行一次
    checkMultiplePrinters(devices);
    
    // 设置定时器
    timer = setInterval(() => {
      checkMultiplePrinters(devices);
    }, refreshInterval.value);
  };

  // 停止自动刷新
  const stopAutoRefresh = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    autoRefreshEnabled.value = false;
  };

  // 切换自动刷新
  const toggleAutoRefresh = (enabled: boolean, devices?: string[]) => {
    if (enabled && devices) {
      startAutoRefresh(devices);
    } else {
      stopAutoRefresh();
    }
  };

  // 组件卸载时清理
  onUnmounted(() => {
    stopAutoRefresh();
  });

  return {
    allStatus,
    isChecking,
    autoRefreshEnabled,
    refreshInterval,
    checkDtpWeb,
    checkPrinterStatus,
    checkMultiplePrinters,
    getStatus,
    startAutoRefresh,
    stopAutoRefresh,
    toggleAutoRefresh,
  };
}
