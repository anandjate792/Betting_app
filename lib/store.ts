"use client"

import { create } from "zustand"
import { useEffect } from "react"
import { authApi, userApi, transactionApi } from "./api"

export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "user"
  walletBalance: number
}

export interface Transaction {
  id: string
  userId: string
  userName: string
  amount: number
  status: "pending" | "approved" | "rejected"
  screenshotImage?: string
  description: string
  createdAt: string
  approvedAt?: string
  approvedBy?: string
}

export interface AppUser {
  id: string
  name: string
  email: string
  role: "admin" | "user"
  walletBalance: number
  createdAt?: string
}

interface AppStore {
  user: User | null
  users: AppUser[]
  transactions: Transaction[]
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  createUser: (name: string, email: string, password: string) => Promise<void>
  deleteUser: (userId: string) => Promise<void>
  addTransaction: (amount: number, description: string, screenshotImage?: string) => Promise<void>
  approveTransaction: (transactionId: string, adminId: string) => Promise<void>
  rejectTransaction: (transactionId: string) => Promise<void>
  addMoneyToWallet: (userId: string, amount: number) => Promise<void>
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>
  fetchUsers: () => Promise<void>
  fetchTransactions: () => Promise<void>
}

export const useAppStore = create<AppStore>((set, get) => ({
  user: null,
  users: [],
  transactions: [],

  login: async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password)
      localStorage.setItem("authToken", response.token)
      set({
        user: response.user,
      })
      if (response.user.role === "admin") {
        await get().fetchUsers()
      }
      await get().fetchTransactions()
      return true
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  },

  logout: () => {
    localStorage.removeItem("authToken")
    set({ user: null, users: [], transactions: [] })
  },

  createUser: async (name: string, email: string, password: string) => {
    try {
      await userApi.createUser(name, email, password)
      await get().fetchUsers()
    } catch (error) {
      console.error("Create user error:", error)
      throw error
    }
  },

  deleteUser: async (userId: string) => {
    try {
      await userApi.deleteUser(userId)
      await get().fetchUsers()
    } catch (error) {
      console.error("Delete user error:", error)
      throw error
    }
  },

  addTransaction: async (amount: number, description: string, screenshotImage?: string) => {
    try {
      await transactionApi.createTransaction(amount, description, screenshotImage || "")
      await get().fetchTransactions()
    } catch (error) {
      console.error("Add transaction error:", error)
      throw error
    }
  },

  approveTransaction: async (transactionId: string, adminId: string) => {
    try {
      await transactionApi.approveTransaction(transactionId)
      await get().fetchTransactions()
      await get().fetchUsers()
    } catch (error) {
      console.error("Approve transaction error:", error)
      throw error
    }
  },

  rejectTransaction: async (transactionId: string) => {
    try {
      await transactionApi.rejectTransaction(transactionId)
      await get().fetchTransactions()
    } catch (error) {
      console.error("Reject transaction error:", error)
      throw error
    }
  },

  addMoneyToWallet: async (userId: string, amount: number) => {
    try {
      await userApi.addMoney(userId, amount)
      await get().fetchUsers()
      if (get().user?.id === userId) {
        set((state) => ({
          user: state.user ? { ...state.user, walletBalance: state.user.walletBalance + amount } : null,
        }))
      }
    } catch (error) {
      console.error("Add money error:", error)
      throw error
    }
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    try {
      await authApi.changePassword(oldPassword, newPassword)
      return true
    } catch (error) {
      console.error("Change password error:", error)
      return false
    }
  },

  fetchUsers: async () => {
    try {
      const currentUser = get().user
      if (!currentUser || currentUser.role !== "admin") return
      const users = await userApi.getAllUsers()
      set({ users })
    } catch (error) {
      console.error("Fetch users error:", error)
    }
  },

  fetchTransactions: async () => {
    try {
      const currentUser = get().user
      if (!currentUser) return
      const transactions =
        currentUser.role === "admin"
          ? await transactionApi.getAllTransactions()
          : await transactionApi.getUserTransactions()
      set({ transactions })
    } catch (error) {
      console.error("Fetch transactions error:", error)
    }
  },
}))

export const useLoadStore = () => {
  useEffect(() => {
    const token = localStorage.getItem("authToken")
    if (!token) return

    const initialize = async () => {
      try {
        const profile = await authApi.getProfile()
        useAppStore.setState((state) => ({
          ...state,
          user: profile,
        }))

        const { role } = profile
        if (role === "admin") {
          await useAppStore.getState().fetchUsers()
        }
        await useAppStore.getState().fetchTransactions()
      } catch (error) {
        console.error("Session restore error:", error)
        localStorage.removeItem("authToken")
        useAppStore.setState({ user: null, users: [], transactions: [] })
      }
    }

    void initialize()
  }, [])
}
