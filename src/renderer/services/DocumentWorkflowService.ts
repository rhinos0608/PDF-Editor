import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

export interface DocumentWorkflow {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'in-review' | 'approved' | 'rejected' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Document information
  documentId: string;
  documentName: string;
  documentVersion: string;
  
  // Workflow configuration
  steps: WorkflowStep[];
  currentStepIndex: number;
  
  // Participants
  initiator: User;
  participants: WorkflowParticipant[];
  
  // Timing
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  completedAt?: Date;
  
  // Metadata
  metadata: {
    category: string;
    tags: string[];
    customFields: { [key: string]: any };
  };
  
  // History
  history: WorkflowHistoryEntry[];
  
  // Settings
  settings: {
    allowParallelSteps: boolean;
    requireAllApprovals: boolean;
    autoReminders: boolean;
    reminderInterval: number; // in hours
    escalationRules: EscalationRule[];
  };
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'review' | 'approve' | 'sign' | 'fill-form' | 'custom';
  description?: string;
  
  // Participants for this step
  assignees: string[]; // User IDs
  reviewers: string[]; // User IDs
  approvers: string[]; // User IDs
  
  // Requirements
  requirements: {
    requiredApprovals: number;
    allowDelegation: boolean;
    requireComments: boolean;
    requiredFields: string[];
    allowRevisions: boolean;
  };
  
  // Status
  status: 'pending' | 'in-progress' | 'completed' | 'rejected' | 'skipped';
  
  // Timing
  dueDate?: Date;
  estimatedDuration?: number; // in hours
  startedAt?: Date;
  completedAt?: Date;
  
  // Actions performed
  actions: WorkflowAction[];
  
  // Conditions
  conditions: {
    skipIf?: string; // JavaScript expression
    requiredPreviousSteps: string[];
    parallelWith: string[];
  };
}

export interface WorkflowParticipant {
  userId: string;
  role: 'reviewer' | 'approver' | 'signer' | 'observer';
  permissions: {
    canView: boolean;
    canComment: boolean;
    canEdit: boolean;
    canApprove: boolean;
    canDelegate: boolean;
  };
  notificationPreferences: {
    email: boolean;
    inApp: boolean;
    sms: boolean;
  };
  delegatedTo?: string; // User ID
}

export interface WorkflowAction {
  id: string;
  type: 'view' | 'comment' | 'edit' | 'approve' | 'reject' | 'sign' | 'delegate' | 'request-changes';
  performedBy: string; // User ID
  timestamp: Date;
  
  // Action details
  details: {
    comments?: string;
    attachments?: FileAttachment[];
    changes?: DocumentChange[];
    signature?: SignatureData;
    delegatedTo?: string;
  };
  
  // Location in document
  location?: {
    pageNumber: number;
    x?: number;
    y?: number;
    area?: { x: number; y: number; width: number; height: number };
  };
}

export interface WorkflowHistoryEntry {
  id: string;
  timestamp: Date;
  event: 'created' | 'started' | 'step-completed' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  performedBy: string; // User ID
  details: {
    stepId?: string;
    stepName?: string;
    comments?: string;
    previousState?: any;
    newState?: any;
  };
}

export interface EscalationRule {
  id: string;
  condition: 'overdue' | 'no-response' | 'custom';
  trigger: {
    delay: number; // in hours
    customCondition?: string; // JavaScript expression
  };
  action: {
    type: 'notify-manager' | 'reassign' | 'skip-step' | 'custom';
    targetUserId?: string;
    notificationMessage?: string;
    customAction?: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  managerId?: string;
  avatar?: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface DocumentChange {
  type: 'text-edit' | 'annotation' | 'form-field' | 'page-operation';
  location: {
    pageNumber: number;
    area?: { x: number; y: number; width: number; height: number };
  };
  before: any;
  after: any;
  timestamp: Date;
}

export interface SignatureData {
  signerId: string;
  signerName: string;
  signatureImageUrl: string;
  certificate?: string;
  timestamp: Date;
  location: {
    pageNumber: number;
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: Omit<WorkflowStep, 'id' | 'status' | 'startedAt' | 'completedAt' | 'actions'>[];
  defaultSettings: DocumentWorkflow['settings'];
  createdBy: string;
  createdAt: Date;
  isPublic: boolean;
}

export class DocumentWorkflowService {
  private workflows: Map<string, DocumentWorkflow> = new Map();
  private templates: Map<string, WorkflowTemplate> = new Map();
  private users: Map<string, User> = new Map();
  private notifications: NotificationService;

  constructor() {
    this.notifications = new NotificationService();
    this.initializeBuiltinTemplates();
    this.startBackgroundTasks();
  }

  /**
   * Create a new workflow from template
   */
  createWorkflowFromTemplate(
    templateId: string,
    documentId: string,
    documentName: string,
    initiatorId: string,
    participants: WorkflowParticipant[],
    options: {
      dueDate?: Date;
      priority?: DocumentWorkflow['priority'];
      customFields?: { [key: string]: any };
    } = {}
  ): DocumentWorkflow {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const workflow: DocumentWorkflow = {
      id: this.generateWorkflowId(),
      name: `${template.name} - ${documentName}`,
      description: template.description,
      status: 'draft',
      priority: options.priority || 'medium',
      
      documentId,
      documentName,
      documentVersion: '1.0',
      
      steps: template.steps.map((step, index) => ({
        ...step,
        id: `step_${index + 1}`,
        status: 'pending',
        actions: []
      })),
      currentStepIndex: 0,
      
      initiator: this.users.get(initiatorId)!,
      participants,
      
      createdAt: new Date(),
      updatedAt: new Date(),
      dueDate: options.dueDate,
      
      metadata: {
        category: template.category,
        tags: [],
        customFields: options.customFields || {}
      },
      
      history: [{
        id: this.generateId(),
        timestamp: new Date(),
        event: 'created',
        performedBy: initiatorId,
        details: {
          comments: 'Workflow created from template'
        }
      }],
      
      settings: { ...template.defaultSettings }
    };

    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  /**
   * Start a workflow
   */
  async startWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    if (workflow.status !== 'draft') {
      throw new Error(`Workflow is not in draft status`);
    }

    workflow.status = 'in-review';
    workflow.updatedAt = new Date();

    // Start the first step
    if (workflow.steps.length > 0) {
      const firstStep = workflow.steps[0];
      firstStep.status = 'in-progress';
      firstStep.startedAt = new Date();

      // Notify assignees
      await this.notifyStepAssignees(workflow, firstStep);
    }

    // Add to history
    workflow.history.push({
      id: this.generateId(),
      timestamp: new Date(),
      event: 'started',
      performedBy: workflow.initiator.id,
      details: {}
    });

    this.workflows.set(workflowId, workflow);
  }

  /**
   * Perform an action on a workflow step
   */
  async performAction(
    workflowId: string,
    stepId: string,
    action: Omit<WorkflowAction, 'id' | 'timestamp'>
  ): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const step = workflow.steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error(`Step ${stepId} not found`);
    }

    if (step.status !== 'in-progress') {
      throw new Error(`Step is not in progress`);
    }

    // Validate user permissions
    if (!this.canUserPerformAction(workflow, step, action.performedBy, action.type)) {
      throw new Error('User does not have permission to perform this action');
    }

    // Create the action
    const workflowAction: WorkflowAction = {
      ...action,
      id: this.generateId(),
      timestamp: new Date()
    };

    step.actions.push(workflowAction);
    workflow.updatedAt = new Date();

    // Process the action
    await this.processAction(workflow, step, workflowAction);

    // Check if step is complete
    if (this.isStepComplete(step)) {
      await this.completeStep(workflow, step);
    }

    this.workflows.set(workflowId, workflow);
  }

  /**
   * Get workflow status
   */
  getWorkflowStatus(workflowId: string): DocumentWorkflow | null {
    return this.workflows.get(workflowId) || null;
  }

  /**
   * Get workflows for user
   */
  getUserWorkflows(userId: string): DocumentWorkflow[] {
    return Array.from(this.workflows.values()).filter(workflow => 
      workflow.initiator.id === userId ||
      workflow.participants.some(p => p.userId === userId) ||
      workflow.steps.some(step => 
        step.assignees.includes(userId) ||
        step.reviewers.includes(userId) ||
        step.approvers.includes(userId)
      )
    );
  }

  /**
   * Get pending tasks for user
   */
  getUserPendingTasks(userId: string): Array<{ workflow: DocumentWorkflow; step: WorkflowStep }> {
    const tasks: Array<{ workflow: DocumentWorkflow; step: WorkflowStep }> = [];

    for (const workflow of this.workflows.values()) {
      if (workflow.status === 'in-review') {
        const currentStep = workflow.steps[workflow.currentStepIndex];
        if (currentStep && currentStep.status === 'in-progress') {
          if (currentStep.assignees.includes(userId) ||
              currentStep.reviewers.includes(userId) ||
              currentStep.approvers.includes(userId)) {
            tasks.push({ workflow, step: currentStep });
          }
        }
      }
    }

    return tasks;
  }

  /**
   * Delegate task to another user
   */
  async delegateTask(
    workflowId: string,
    stepId: string,
    fromUserId: string,
    toUserId: string,
    reason?: string
  ): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const step = workflow.steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error(`Step ${stepId} not found`);
    }

    if (!step.requirements.allowDelegation) {
      throw new Error('Delegation is not allowed for this step');
    }

    // Update participant delegation
    const participant = workflow.participants.find(p => p.userId === fromUserId);
    if (participant && participant.permissions.canDelegate) {
      participant.delegatedTo = toUserId;
    }

    // Create delegation action
    await this.performAction(workflowId, stepId, {
      type: 'delegate',
      performedBy: fromUserId,
      details: {
        delegatedTo: toUserId,
        comments: reason || 'Task delegated'
      }
    });

    // Notify the new assignee
    await this.notifications.sendNotification(toUserId, {
      type: 'task-delegated',
      title: 'Task Delegated to You',
      message: `A task has been delegated to you by ${this.users.get(fromUserId)?.name}`,
      workflowId,
      stepId
    });
  }

  /**
   * Add comment to workflow step
   */
  async addComment(
    workflowId: string,
    stepId: string,
    userId: string,
    comment: string,
    location?: WorkflowAction['location']
  ): Promise<void> {
    await this.performAction(workflowId, stepId, {
      type: 'comment',
      performedBy: userId,
      details: {
        comments: comment
      },
      location
    });
  }

  /**
   * Request changes on document
   */
  async requestChanges(
    workflowId: string,
    stepId: string,
    userId: string,
    changes: string,
    location?: WorkflowAction['location']
  ): Promise<void> {
    await this.performAction(workflowId, stepId, {
      type: 'request-changes',
      performedBy: userId,
      details: {
        comments: changes
      },
      location
    });
  }

  /**
   * Approve workflow step
   */
  async approveStep(
    workflowId: string,
    stepId: string,
    userId: string,
    comments?: string
  ): Promise<void> {
    await this.performAction(workflowId, stepId, {
      type: 'approve',
      performedBy: userId,
      details: {
        comments
      }
    });
  }

  /**
   * Reject workflow step
   */
  async rejectStep(
    workflowId: string,
    stepId: string,
    userId: string,
    reason: string
  ): Promise<void> {
    await this.performAction(workflowId, stepId, {
      type: 'reject',
      performedBy: userId,
      details: {
        comments: reason
      }
    });

    const workflow = this.workflows.get(workflowId)!;
    workflow.status = 'rejected';
    workflow.updatedAt = new Date();
  }

  /**
   * Create workflow template
   */
  createTemplate(template: Omit<WorkflowTemplate, 'id' | 'createdAt'>): WorkflowTemplate {
    const workflowTemplate: WorkflowTemplate = {
      ...template,
      id: this.generateTemplateId(),
      createdAt: new Date()
    };

    this.templates.set(workflowTemplate.id, workflowTemplate);
    return workflowTemplate;
  }

  /**
   * Get available templates
   */
  getTemplates(category?: string): WorkflowTemplate[] {
    const templates = Array.from(this.templates.values());
    if (category) {
      return templates.filter(t => t.category === category);
    }
    return templates;
  }

  // Private helper methods

  private async processAction(
    workflow: DocumentWorkflow,
    step: WorkflowStep,
    action: WorkflowAction
  ): Promise<void> {
    switch (action.type) {
      case 'approve':
        await this.handleApproval(workflow, step, action);
        break;
      case 'reject':
        await this.handleRejection(workflow, step, action);
        break;
      case 'sign':
        await this.handleSignature(workflow, step, action);
        break;
      default:
        // Handle other action types
        break;
    }
  }

  private async handleApproval(
    workflow: DocumentWorkflow,
    step: WorkflowStep,
    action: WorkflowAction
  ): Promise<void> {
    const approvals = step.actions.filter(a => a.type === 'approve').length;
    
    if (approvals >= step.requirements.requiredApprovals) {
      step.status = 'completed';
      step.completedAt = new Date();
      
      // Notify participants
      await this.notifyStepCompletion(workflow, step, 'approved');
    }
  }

  private async handleRejection(
    workflow: DocumentWorkflow,
    step: WorkflowStep,
    action: WorkflowAction
  ): Promise<void> {
    step.status = 'rejected';
    workflow.status = 'rejected';
    
    // Notify participants
    await this.notifyStepCompletion(workflow, step, 'rejected');
  }

  private async handleSignature(
    workflow: DocumentWorkflow,
    step: WorkflowStep,
    action: WorkflowAction
  ): Promise<void> {
    if (action.details.signature) {
      // Process signature
      step.status = 'completed';
      step.completedAt = new Date();
      
      await this.notifyStepCompletion(workflow, step, 'signed');
    }
  }

  private isStepComplete(step: WorkflowStep): boolean {
    switch (step.type) {
      case 'approve':
        const approvals = step.actions.filter(a => a.type === 'approve').length;
        return approvals >= step.requirements.requiredApprovals;
      
      case 'review':
        const reviews = step.actions.filter(a => a.type === 'view' || a.type === 'comment').length;
        return reviews > 0; // At least one review action
      
      case 'sign':
        return step.actions.some(a => a.type === 'sign');
      
      default:
        return step.actions.length > 0;
    }
  }

  private async completeStep(workflow: DocumentWorkflow, step: WorkflowStep): Promise<void> {
    step.status = 'completed';
    step.completedAt = new Date();

    // Add to history
    workflow.history.push({
      id: this.generateId(),
      timestamp: new Date(),
      event: 'step-completed',
      performedBy: step.actions[step.actions.length - 1]?.performedBy || workflow.initiator.id,
      details: {
        stepId: step.id,
        stepName: step.name
      }
    });

    // Move to next step or complete workflow
    if (workflow.currentStepIndex < workflow.steps.length - 1) {
      workflow.currentStepIndex++;
      const nextStep = workflow.steps[workflow.currentStepIndex];
      nextStep.status = 'in-progress';
      nextStep.startedAt = new Date();
      
      await this.notifyStepAssignees(workflow, nextStep);
    } else {
      // Workflow completed
      workflow.status = 'completed';
      workflow.completedAt = new Date();
      
      workflow.history.push({
        id: this.generateId(),
        timestamp: new Date(),
        event: 'completed',
        performedBy: workflow.initiator.id,
        details: {}
      });

      await this.notifyWorkflowCompletion(workflow);
    }
  }

  private canUserPerformAction(
    workflow: DocumentWorkflow,
    step: WorkflowStep,
    userId: string,
    actionType: WorkflowAction['type']
  ): boolean {
    const participant = workflow.participants.find(p => p.userId === userId);
    if (!participant) return false;

    // Check if user is assigned to this step
    const isAssignee = step.assignees.includes(userId) ||
                      step.reviewers.includes(userId) ||
                      step.approvers.includes(userId);
    
    if (!isAssignee && !participant.delegatedTo) return false;

    // Check permissions based on action type
    switch (actionType) {
      case 'approve':
        return participant.permissions.canApprove && step.approvers.includes(userId);
      case 'comment':
        return participant.permissions.canComment;
      case 'edit':
        return participant.permissions.canEdit;
      case 'view':
        return participant.permissions.canView;
      case 'delegate':
        return participant.permissions.canDelegate;
      default:
        return true;
    }
  }

  private async notifyStepAssignees(workflow: DocumentWorkflow, step: WorkflowStep): Promise<void> {
    const assignees = [...step.assignees, ...step.reviewers, ...step.approvers];
    
    for (const userId of assignees) {
      await this.notifications.sendNotification(userId, {
        type: 'task-assigned',
        title: 'New Task Assigned',
        message: `You have been assigned a task in workflow: ${workflow.name}`,
        workflowId: workflow.id,
        stepId: step.id
      });
    }
  }

  private async notifyStepCompletion(
    workflow: DocumentWorkflow,
    step: WorkflowStep,
    result: string
  ): Promise<void> {
    // Notify workflow participants
    for (const participant of workflow.participants) {
      await this.notifications.sendNotification(participant.userId, {
        type: 'step-completed',
        title: `Workflow Step ${result}`,
        message: `Step "${step.name}" has been ${result} in workflow: ${workflow.name}`,
        workflowId: workflow.id,
        stepId: step.id
      });
    }
  }

  private async notifyWorkflowCompletion(workflow: DocumentWorkflow): Promise<void> {
    // Notify all participants
    for (const participant of workflow.participants) {
      await this.notifications.sendNotification(participant.userId, {
        type: 'workflow-completed',
        title: 'Workflow Completed',
        message: `Workflow "${workflow.name}" has been completed successfully.`,
        workflowId: workflow.id
      });
    }
  }

  private startBackgroundTasks(): void {
    // Check for overdue tasks every hour
    setInterval(() => {
      this.checkOverdueTasks();
    }, 60 * 60 * 1000);

    // Send reminders every 4 hours
    setInterval(() => {
      this.sendReminders();
    }, 4 * 60 * 60 * 1000);
  }

  private async checkOverdueTasks(): Promise<void> {
    const now = new Date();
    
    for (const workflow of this.workflows.values()) {
      if (workflow.status === 'in-review') {
        const currentStep = workflow.steps[workflow.currentStepIndex];
        if (currentStep && currentStep.dueDate && currentStep.dueDate < now) {
          await this.handleOverdueStep(workflow, currentStep);
        }
      }
    }
  }

  private async handleOverdueStep(workflow: DocumentWorkflow, step: WorkflowStep): Promise<void> {
    // Apply escalation rules
    for (const rule of workflow.settings.escalationRules) {
      if (rule.condition === 'overdue') {
        await this.applyEscalationRule(workflow, step, rule);
      }
    }
  }

  private async applyEscalationRule(
    workflow: DocumentWorkflow,
    step: WorkflowStep,
    rule: EscalationRule
  ): Promise<void> {
    switch (rule.action.type) {
      case 'notify-manager':
        // Find managers of assignees and notify them
        for (const assigneeId of step.assignees) {
          const assignee = this.users.get(assigneeId);
          if (assignee?.managerId) {
            await this.notifications.sendNotification(assignee.managerId, {
              type: 'escalation',
              title: 'Overdue Task Escalation',
              message: `Task in workflow "${workflow.name}" is overdue and requires attention.`,
              workflowId: workflow.id,
              stepId: step.id
            });
          }
        }
        break;
      
      case 'reassign':
        if (rule.action.targetUserId) {
          step.assignees = [rule.action.targetUserId];
          await this.notifyStepAssignees(workflow, step);
        }
        break;
      
      case 'skip-step':
        step.status = 'skipped';
        await this.completeStep(workflow, step);
        break;
    }
  }

  private async sendReminders(): Promise<void> {
    const now = new Date();
    
    for (const workflow of this.workflows.values()) {
      if (workflow.status === 'in-review' && workflow.settings.autoReminders) {
        const currentStep = workflow.steps[workflow.currentStepIndex];
        if (currentStep && currentStep.status === 'in-progress') {
          const hoursSinceStart = currentStep.startedAt ? 
            (now.getTime() - currentStep.startedAt.getTime()) / (1000 * 60 * 60) : 0;
          
          if (hoursSinceStart >= workflow.settings.reminderInterval) {
            await this.sendStepReminders(workflow, currentStep);
          }
        }
      }
    }
  }

  private async sendStepReminders(workflow: DocumentWorkflow, step: WorkflowStep): Promise<void> {
    const assignees = [...step.assignees, ...step.reviewers, ...step.approvers];
    
    for (const userId of assignees) {
      // Check if user has already completed their part
      const hasActed = step.actions.some(a => a.performedBy === userId);
      if (!hasActed) {
        await this.notifications.sendNotification(userId, {
          type: 'reminder',
          title: 'Task Reminder',
          message: `Reminder: You have a pending task in workflow: ${workflow.name}`,
          workflowId: workflow.id,
          stepId: step.id
        });
      }
    }
  }

  private generateWorkflowId(): string {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTemplateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeBuiltinTemplates(): void {
    // Document Review Template
    const reviewTemplate: WorkflowTemplate = {
      id: 'document-review',
      name: 'Document Review',
      description: 'Standard document review workflow',
      category: 'Review',
      steps: [
        {
          name: 'Initial Review',
          type: 'review',
          assignees: [],
          reviewers: [],
          approvers: [],
          requirements: {
            requiredApprovals: 1,
            allowDelegation: true,
            requireComments: false,
            requiredFields: [],
            allowRevisions: true
          },
          conditions: {
            requiredPreviousSteps: [],
            parallelWith: []
          }
        },
        {
          name: 'Manager Approval',
          type: 'approve',
          assignees: [],
          reviewers: [],
          approvers: [],
          requirements: {
            requiredApprovals: 1,
            allowDelegation: false,
            requireComments: true,
            requiredFields: [],
            allowRevisions: false
          },
          conditions: {
            requiredPreviousSteps: ['step_1'],
            parallelWith: []
          }
        }
      ],
      defaultSettings: {
        allowParallelSteps: false,
        requireAllApprovals: true,
        autoReminders: true,
        reminderInterval: 24,
        escalationRules: []
      },
      createdBy: 'system',
      createdAt: new Date(),
      isPublic: true
    };

    this.templates.set(reviewTemplate.id, reviewTemplate);

    // Contract Approval Template
    const contractTemplate: WorkflowTemplate = {
      id: 'contract-approval',
      name: 'Contract Approval',
      description: 'Multi-stage contract approval process',
      category: 'Legal',
      steps: [
        {
          name: 'Legal Review',
          type: 'review',
          assignees: [],
          reviewers: [],
          approvers: [],
          requirements: {
            requiredApprovals: 1,
            allowDelegation: true,
            requireComments: true,
            requiredFields: [],
            allowRevisions: true
          },
          conditions: {
            requiredPreviousSteps: [],
            parallelWith: []
          }
        },
        {
          name: 'Financial Review',
          type: 'review',
          assignees: [],
          reviewers: [],
          approvers: [],
          requirements: {
            requiredApprovals: 1,
            allowDelegation: true,
            requireComments: false,
            requiredFields: [],
            allowRevisions: true
          },
          conditions: {
            requiredPreviousSteps: [],
            parallelWith: ['step_1']
          }
        },
        {
          name: 'Executive Approval',
          type: 'approve',
          assignees: [],
          reviewers: [],
          approvers: [],
          requirements: {
            requiredApprovals: 1,
            allowDelegation: false,
            requireComments: false,
            requiredFields: [],
            allowRevisions: false
          },
          conditions: {
            requiredPreviousSteps: ['step_1', 'step_2'],
            parallelWith: []
          }
        },
        {
          name: 'Digital Signature',
          type: 'sign',
          assignees: [],
          reviewers: [],
          approvers: [],
          requirements: {
            requiredApprovals: 1,
            allowDelegation: false,
            requireComments: false,
            requiredFields: [],
            allowRevisions: false
          },
          conditions: {
            requiredPreviousSteps: ['step_3'],
            parallelWith: []
          }
        }
      ],
      defaultSettings: {
        allowParallelSteps: true,
        requireAllApprovals: true,
        autoReminders: true,
        reminderInterval: 48,
        escalationRules: [
          {
            id: 'overdue-escalation',
            condition: 'overdue',
            trigger: { delay: 72 },
            action: { type: 'notify-manager' }
          }
        ]
      },
      createdBy: 'system',
      createdAt: new Date(),
      isPublic: true
    };

    this.templates.set(contractTemplate.id, contractTemplate);
  }
}

/**
 * Simple notification service for workflow notifications
 */
class NotificationService {
  async sendNotification(userId: string, notification: {
    type: string;
    title: string;
    message: string;
    workflowId: string;
    stepId?: string;
  }): Promise<void> {
    // In a real implementation, this would send emails, push notifications, etc.
    console.log(`Notification sent to ${userId}:`, notification);
  }
}

export default DocumentWorkflowService;
