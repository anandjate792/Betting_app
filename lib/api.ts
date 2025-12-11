const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken");
};

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "API Error");
  }

  return response.json();
}

export const authApi = {
  login: (email: string, password: string) =>
    apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  getProfile: () =>
    apiCall("/auth/me", {
      method: "GET",
    }),
  changePassword: (oldPassword: string, newPassword: string) =>
    apiCall("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ oldPassword, newPassword }),
    }),
};

export const userApi = {
  getAllUsers: () => apiCall("/users", { method: "GET" }),
  createUser: (name: string, email: string, password: string) =>
    apiCall("/users", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),
  deleteUser: (userId: string) =>
    apiCall(`/users/${userId}`, { method: "DELETE" }),
  addMoney: (userId: string, amount: number) =>
    apiCall(`/users/${userId}`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),
};

export const transactionApi = {
  getAllTransactions: (limit = 10, skip = 0) =>
    apiCall(`/transactions?admin=true&limit=${limit}&skip=${skip}`, { method: "GET" }),
  getUserTransactions: (limit = 10, skip = 0) =>
    apiCall(`/transactions?limit=${limit}&skip=${skip}`, { method: "GET" }),
  createTransaction: (
    amount: number,
    description: string,
    screenshotImage: string
  ) =>
    apiCall("/transactions", {
      method: "POST",
      body: JSON.stringify({ amount, description, screenshotImage }),
    }),
  approveTransaction: (transactionId: string) =>
    apiCall(`/transactions/${transactionId}?action=approve`, {
      method: "POST",
    }),
  rejectTransaction: (transactionId: string) =>
    apiCall(`/transactions/${transactionId}?action=reject`, { method: "POST" }),
};

export const predictionApi = {
  getCurrentSlot: async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/prediction-slots?current=true`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
          },
        }
      );
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "API Error");
      }
      return response.json();
    } catch (error: any) {
      if (
        error?.message?.includes("No active slot found") ||
        error?.message?.includes("404")
      ) {
        return null;
      }
      throw error;
    }
  },
  getAllSlots: () => apiCall("/prediction-slots", { method: "GET" }),
  createSlot: (startTime: string, endTime: string) =>
    apiCall("/prediction-slots", {
      method: "POST",
      body: JSON.stringify({ startTime, endTime }),
    }),
  completeSlot: (slotId: string, winningIcon: string) =>
    apiCall(`/prediction-slots/${slotId}`, {
      method: "POST",
      body: JSON.stringify({ winningIcon }),
    }),
  autoCreateSlot: () =>
    apiCall("/prediction-slots/auto-create", { method: "POST" }),
  autoCreateSlotToggle: (enabled: boolean) =>
    apiCall(
      `/prediction-slots/auto-create?toggle=true&enabled=${
        enabled ? "1" : "0"
      }`,
      {
        method: "POST",
      }
    ),
  getAutoCreateStatus: () =>
    apiCall("/prediction-slots/auto-create", { method: "GET" }),
  autoCompleteSlots: () =>
    apiCall("/prediction-slots/auto-complete", { method: "POST" }),
};

export const betApi = {
  getBets: (slotId?: string, limit = 10, skip = 0) => {
    const url = slotId
      ? `/bets?slotId=${slotId}&limit=${limit}&skip=${skip}`
      : `/bets?limit=${limit}&skip=${skip}`;
    return apiCall(url, { method: "GET" });
  },
  placeBet: (slotId: string, icon: string, amount: number) =>
    apiCall("/bets", {
      method: "POST",
      body: JSON.stringify({ slotId, icon, amount }),
    }),
};

export const withdrawalApi = {
  getWithdrawals: (limit = 10, skip = 0) =>
    apiCall(`/withdrawals?limit=${limit}&skip=${skip}`, { method: "GET" }),
  requestWithdrawal: (amount: number) =>
    apiCall("/withdrawals", {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),
  approveWithdrawal: (withdrawalId: string) =>
    apiCall(`/withdrawals/${withdrawalId}?action=approve`, { method: "POST" }),
  rejectWithdrawal: (withdrawalId: string) =>
    apiCall(`/withdrawals/${withdrawalId}?action=reject`, { method: "POST" }),
};
