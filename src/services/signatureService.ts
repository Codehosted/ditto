import { db, collection, addDoc, Timestamp, updateDoc, doc } from '../firebase';

export interface SignatureRequest {
  documentId: string;
  familyId: string;
  signerEmail: string;
  signerName: string;
}

export const sendSignatureRequest = async (request: SignatureRequest) => {
  // In a real app, this would call the DocuSign API via a backend proxy
  // For this prototype, we'll simulate the envelope creation
  
  const mockEnvelopeId = `ds-${Math.random().toString(36).substring(2, 12)}`;

  try {
    // 1. Create the signature request record
    const docRef = await addDoc(collection(db, 'signatureRequests'), {
      documentId: request.documentId,
      familyId: request.familyId,
      signerEmail: request.signerEmail,
      status: 'sent',
      envelopeId: mockEnvelopeId,
      createdAt: Timestamp.now(),
    });

    // 2. Update the document status
    const documentRef = doc(db, 'families', request.familyId, 'documents', request.documentId);
    await updateDoc(documentRef, {
      signatureStatus: 'pending'
    });

    return { id: docRef.id, envelopeId: mockEnvelopeId };
  } catch (error) {
    console.error('Error sending signature request:', error);
    throw error;
  }
};

export const getDocuSignAuthUrl = () => {
  const clientId = process.env.VITE_DOCUSIGN_CLIENT_ID;
  const redirectUri = `${window.location.origin}/auth/callback`;
  return `https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature&client_id=${clientId}&redirect_uri=${redirectUri}`;
};
