"use client";

import { useState, useRef } from "react";
import { useAppStore } from "@/lib/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet, Upload } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export default function WalletPage() {
  const { user, addTransaction } = useAppStore();
  const [transactionAmount, setTransactionAmount] = useState<string>("");
  const [transactionDescription, setTransactionDescription] = useState<string>("");
  const [utrNumber, setUtrNumber] = useState<string>("");
  const [screenshotImage, setScreenshotImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setScreenshotImage(base64String);
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitTransaction = async () => {
    if (!transactionAmount || !transactionDescription || !utrNumber) {
      alert("Please fill in all fields including UTR number");
      return;
    }

    const amount = parseFloat(transactionAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a positive amount only");
      return;
    }

    if (amount < 100) {
      alert("Minimum deposit amount is ₹100");
      return;
    }

    setTransactionLoading(true);
    try {
      await addTransaction(
        amount,
        `${transactionDescription} (UTR: ${utrNumber})`,
        screenshotImage || undefined
      );
      setTransactionAmount("");
      setTransactionDescription("");
      setUtrNumber("");
      setScreenshotImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      alert("Transaction submitted successfully! It will be reviewed by admin.");
    } catch (error) {
      console.error("Failed to submit transaction:", error);
      alert("Failed to submit transaction. Please try again.");
    } finally {
      setTransactionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Wallet Balance */}
        <Card className="border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Wallet className="w-5 h-5" />
              Wallet Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-400">
              ₹{user?.walletBalance.toFixed(2) || "0.00"}
            </div>
            <p className="text-slate-400 text-sm mt-2">Your current wallet balance</p>
          </CardContent>
        </Card>

        {/* Upload Transaction */}
        <Card className="border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Upload Transaction</CardTitle>
            <CardDescription className="text-slate-400">
              Upload a screenshot of your Gpay transaction to add money to your wallet (Minimum: ₹100)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Amount
              </label>
              <Input
                type="number"
                placeholder="Enter amount (Minimum: ₹100)"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                UTR Number
              </label>
              <Input
                type="text"
                placeholder="Enter UTR number"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description
              </label>
              <Input
                type="text"
                placeholder="Transaction description"
                value={transactionDescription}
                onChange={(e) => setTransactionDescription(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Screenshot
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="screenshot-upload"
              />
              <label
                htmlFor="screenshot-upload"
                className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
              >
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="text-slate-400">
                  {imagePreview ? "Change Image" : "Upload Screenshot"}
                </span>
              </label>
              {imagePreview && (
                <div className="mt-4">
                  <img
                    src={imagePreview}
                    alt="Screenshot preview"
                    className="w-full max-h-64 object-contain rounded-lg border border-slate-600"
                  />
                </div>
              )}
            </div>
            <Button
              onClick={handleSubmitTransaction}
              disabled={transactionLoading || !transactionAmount || !transactionDescription || !utrNumber}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {transactionLoading ? (
                <>
                  <Spinner className="w-4 h-4 mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Transaction"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
