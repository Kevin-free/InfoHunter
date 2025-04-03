export const WORKFLOW_PACKAGES = [
  {
    id: 'basic',
    name: 'Basic',
    price: 5,
    workflowCount: 10,
    description: 'Good for getting started'
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 30,
    workflowCount: 100,
    description: 'Perfect for small teams'
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 100,
    workflowCount: 1000,
    description: 'For serious automation needs'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null, // 价格未定
    workflowCount: null, // 工作流数量未定
    description: 'Custom solutions for large organizations',
    contactUs: true
  }
];

export const INITIAL_USER_CREDITS = 5;
export const INITIAL_USER_WORKFLOWS = 1;
export const CONTACT_EMAIL = 'sales@yourcompany.com';
