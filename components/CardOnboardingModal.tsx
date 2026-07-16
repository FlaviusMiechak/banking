import { useState, FormEvent, useEffect, useRef } from "react";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface FormState {
  pin: string;
  phone: string;
  country: string;
  tax: string;
  city: string;
  line1: string;
  postalCode: string;
  documentFile?: File;
}

interface CardCreationRequest extends FormState {
  userId: string;
  email: string;
}

interface CardOnboardingModalProps {
  user: User;
  onSuccess: () => void;
  onClose?: () => void;
}

export default function CardOnboardingModal({ user, onSuccess, onClose }: CardOnboardingModalProps) {
  const [form, setForm] = useState<FormState>({ 
    pin: "", 
    phone: "", 
    country: "", 
    tax: "", 
    city: "", 
    line1: "", 
    postalCode: "" 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [documentUploading, setDocumentUploading] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Log user data for debugging
  useEffect(() => {
    console.log("Modal user data:", user);
    console.log("User ID:", user?.id);
    console.log("User email:", user?.email);
    console.log("User full name:", `${user?.first_name || ''} ${user?.last_name || ''}`.trim());
  }, [user]);

  // Upload document to Stripe
  const uploadDocument = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/upload-document', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload document');
      }
      
      const data = await response.json();
      return data.fileId;
    } catch (error) {
      console.error("Error uploading document:", error);
      throw error;
    }
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG, or PDF file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setDocumentUploading(true);
    setError(null);
    setDocumentName(file.name);

    try {
      const fileId = await uploadDocument(file);
      setDocumentId(fileId);
      setForm({ ...form, tax: fileId, documentFile: file });
      console.log("Document uploaded with ID:", fileId);
    } catch (error) {
      setError("Failed to upload document. Please try again.");
      setDocumentId(null);
      setDocumentName("");
    } finally {
      setDocumentUploading(false);
    }
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validate user data
      if (!user?.id) {
        throw new Error("User ID is missing");
      }

      // Check if document is uploaded
      if (!documentId) {
        throw new Error("Please upload a verification document");
      }

      const payload: CardCreationRequest = { 
        ...form, 
        userId: user.id, 
        email: user.email,
        tax: documentId // Use the uploaded document ID
      };

      console.log("Sending payload:", payload);
      
      const res = await fetch("/api/create-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      console.log("Response:", data);
      
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setError(data.error || "Failed to create card");
      }
    } catch (error) {
      console.error("Error creating card:", error);
      setError(error instanceof Error ? error.message : "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim();

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {onClose && (
          <button className="close-btn" onClick={onClose}>✕</button>
        )}
        
        {!success ? (
          <>
            <h2>💳 Create Your Card</h2>
            <span className="modal-subtitle">
              {fullName ? (
                <>Welcome, {fullName}!</>
              ) : (
                "Fill in the details to issue your virtual card"
              )}
            </span>
            
            {error && (
              <div className="error-message">
                ❌ {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="input-group">
                  <label>PIN</label>
                  <input 
                    type="password" 
                    placeholder="Enter PIN" 
                    onChange={e => setForm({ ...form, pin: e.target.value })}
                    required
                    maxLength={4}
                    pattern="[0-9]{4}"
                    title="Enter 4-digit PIN"
                  />
                </div>
                
                <div className="input-group">
                  <label>Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="+1 234 567 890" 
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Country</label>
                <input 
                  type="text" 
                  placeholder="United States" 
                  onChange={e => setForm({ ...form, country: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>City</label>
                  <input 
                    type="text" 
                    placeholder="New York" 
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label>Postal Code</label>
                  <input 
                    type="text" 
                    placeholder="10001" 
                    onChange={e => setForm({ ...form, postalCode: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Street Address</label>
                <input 
                  type="text" 
                  placeholder="123 Main Street" 
                  onChange={e => setForm({ ...form, line1: e.target.value })}
                  required
                />
              </div>

              {/* Document Upload Section */}
              <div className="input-group">
                <label>Verification Document (ID/Passport)</label>
                <div className="file-upload-container">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".jpg,.jpeg,.png,.pdf"
                    style={{ display: 'none' }}
                    id="document-upload"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="file-upload-btn"
                    disabled={documentUploading}
                  >
                    {documentUploading ? (
                      <>
                        <span className="spinner-small"></span>
                        Uploading...
                      </>
                    ) : documentName ? (
                      <>
                        📄 {documentName}
                      </>
                    ) : (
                      <>
                        📤 Choose Document
                      </>
                    )}
                  </button>
                  {documentName && (
                    <span className="file-status success">
                      ✓ Document uploaded
                    </span>
                  )}
                  <p className="file-hint">
                    Accepted: JPEG, PNG, PDF (Max 5MB)
                  </p>
                </div>
              </div>

              <button type="submit" disabled={loading || !documentId}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Creating...
                  </>
                ) : (
                  `Create Card ${fullName ? `for ${fullName}` : ''}`
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="modal-success">
            <div className="checkmark">✅</div>
            <h2 style={{ 
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>
              Card Created!
            </h2>
            <p style={{ color: "#6b7280", marginTop: "8px" }}>
              Your virtual card has been successfully issued
            </p>
          </div>
        )}
      </div>
    </div>
  );
}