import { db, collection, addDoc, Timestamp } from '../firebase';

export enum AuditAction {
  VIEW_PII = 'view_pii',
  UPDATE_BENEFICIARY = 'update_beneficiary',
  DELETE_DOCUMENT = 'delete_document',
  INVITE_MEMBER = 'invite_member',
  LOGIN = 'login',
  LOGOUT = 'logout',
}

export interface AuditLog {
  userId: string;
  action: AuditAction;
  resourceId?: string;
  resourceType?: string;
  details?: string;
  timestamp: Timestamp;
}

export const logAction = async (userId: string, action: AuditAction, resourceId?: string, resourceType?: string, details?: string) => {
  try {
    await addDoc(collection(db, 'auditLogs'), {
      userId,
      action,
      resourceId,
      resourceType,
      details,
      timestamp: Timestamp.now(),
    });
  } catch (error) {
    console.error('Failed to log action:', error);
  }
};
