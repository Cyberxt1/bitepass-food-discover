const firebaseConfig = {
  apiKey: "AIzaSyCRtfuOl-lArLd-1sfVn4y3H20nVkzCgXo",
  authDomain: "bitepass-51358.firebaseapp.com",
  projectId: "bitepass-51358",
  storageBucket: "bitepass-51358.firebasestorage.app",
  messagingSenderId: "1074368767309",
  appId: "1:1074368767309:web:64463c518e5f1d11594304",
  measurementId: "G-Z6PC07XY98",
};

type FirebaseRuntime = {
  auth: unknown;
  db: unknown;
  authSdk: Record<string, (...args: unknown[]) => unknown>;
  firestoreSdk: Record<string, (...args: unknown[]) => unknown>;
};

let runtimePromise: Promise<FirebaseRuntime> | null = null;

export async function getFirebase(): Promise<FirebaseRuntime> {
  if (typeof window === "undefined") {
    throw new Error("Firebase is only available in the browser");
  }

  runtimePromise ??= Promise.all([
    import(/* @vite-ignore */ "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js"),
    import(/* @vite-ignore */ "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js"),
    import(/* @vite-ignore */ "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js"),
  ]).then(async ([appSdk, authSdk, firestoreSdk]) => {
    const existing = appSdk.getApps();
    const app = existing.length ? existing[0] : appSdk.initializeApp(firebaseConfig);

    import(/* @vite-ignore */ "https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js")
      .then((analyticsSdk) => analyticsSdk.isSupported().then((ok: boolean) => ok && analyticsSdk.getAnalytics(app)))
      .catch(() => {});

    return {
      auth: authSdk.getAuth(app),
      db: firestoreSdk.getFirestore(app),
      authSdk,
      firestoreSdk,
    };
  });

  return runtimePromise;
}
