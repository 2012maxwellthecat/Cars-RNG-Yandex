let loadingReadyReported = false;

export function reportLoadingReady(): void {
  if (loadingReadyReported) return;

  const loadingApi = window.ysdk?.features?.LoadingAPI;
  if (!loadingApi) return;

  try {
    loadingApi.ready();
    loadingReadyReported = true;
    console.log("[Yandex SDK] LoadingAPI.ready() called");
  } catch (error) {
    console.error("[Yandex SDK] LoadingAPI.ready() error:", error);
  }
}

