import { useEffect, useState } from "react";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

const toastContainer: Toast[] = [];
const listeners: Set<() => void> = new Set();

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

export const toast = {
  success: (message: string) => {
    const id = Date.now().toString();
    toastContainer.push({ id, message, type: "success" });
    notifyListeners();
    setTimeout(() => {
      const index = toastContainer.findIndex((t) => t.id === id);
      if (index > -1) {
        toastContainer.splice(index, 1);
        notifyListeners();
      }
    }, 4000);
  },
  error: (message: string) => {
    const id = Date.now().toString();
    toastContainer.push({ id, message, type: "error" });
    notifyListeners();
    setTimeout(() => {
      const index = toastContainer.findIndex((t) => t.id === id);
      if (index > -1) {
        toastContainer.splice(index, 1);
        notifyListeners();
      }
    }, 4000);
  },
  info: (message: string) => {
    const id = Date.now().toString();
    toastContainer.push({ id, message, type: "info" });
    notifyListeners();
    setTimeout(() => {
      const index = toastContainer.findIndex((t) => t.id === id);
      if (index > -1) {
        toastContainer.splice(index, 1);
        notifyListeners();
      }
    }, 4000);
  },
};

export const ToastContainer = () => {
  const [, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const updateToasts = () => {
      setToasts([...toastContainer]);
    };

    listeners.add(updateToasts);
    updateToasts();

    return () => {
      listeners.delete(updateToasts);
    };
  }, []);

  const toasts = [...toastContainer];

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`min-w-[300px] p-4 rounded-lg shadow-lg text-white ${
            toast.type === "success"
              ? "bg-green-600"
              : toast.type === "error"
              ? "bg-red-600"
              : "bg-blue-600"
          } animate-in slide-in-from-top-5`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};

