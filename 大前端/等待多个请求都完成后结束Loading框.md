# 等待多个请求（请求并发执行）都完成后结束Loading框

```typescript
onMounted(() => initializeApp(
  initSwiper(),
  initNoticeText(),
  initCardTypes(),
  initCards()
));

/**
 * 传入多个promise对象，当全部结束时取消Loading
 * @param promises 传入多个promise对象，当全部结束时取消Loading
 */
export const initializeApp = async (...promises: Promise<void>[]) => {
  // loading方法全局封装成一个组件
  showLoading();
  try {
    await Promise.all(promises);
  } catch (e) {
    console.error(e);
  } finally {
    hideLoading();
  }
};

// 其中一个方法，经过async返回的是一个promise对象
const initCards = async () => {
  return getCards().then(res => {
    cards.value = res.rows as card[]
  })
}

export const getCards = () => {
  return httpPostByForm<any, card>("xxxx, {
    clientType,
    hot: "true",
  });
};

export const httpPostByForm = <T, U>(url: string, data?: any) => {
  return http<T, U>({
    method: "POST",
    url: url,
    header: { "Content-Type": "application/x-www-form-urlencoded" },
    data: data,
  });
};

// 下面这里使用axios是一样的
export const http = <T, U>(options: UniApp.RequestOptions) => {
  // 1. 返回Promise对象
  return new Promise<HttpResponse<T, U>>((resolve, reject) => {
    uni.request({
      ...options,
      success(res) {
        resolve(res.data)
      },
      false(err: any) {
        reject(err);
      },
    });
  });
};
```

