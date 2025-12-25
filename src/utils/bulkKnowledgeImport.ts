import { supabase } from '@/integrations/supabase/client';

// Complete Credit Solutions knowledge base entries
export const knowledgeBaseEntries = [
  {
    title: "About Complete Credit Solutions",
    content: "Complete Credit Solutions (CCS) is a dynamic and forward-thinking Australian owned and operated business that constantly pursues excellence. Fuelled by a sense of compassion for customers facing financial hardships and recognizing the necessity to transform consumer debt management, our founders laid the foundation for the company we are today. Through a sustainable and customer-centric approach, CCS has fostered meaningful relationships with customers, clients, suppliers, and staff.",
    category: "company"
  },
  {
    title: "CCS Mission and Vision",
    content: "Our Mission: To provide better financial outcomes to our customers, through flexible payment solutions. Our Vision: Be the most trusted and recognised partner to our clients, customers, and stakeholders.",
    category: "company"
  },
  {
    title: "CCS Values",
    content: "Collaboration: We work together to achieve the best results for our company, our customers and our clients. Customer Focus: We prioritise delivering sustainable and meaningful change to customers' financial situation and providing an excellent customer experience. Accountability: We are proud of how we conduct ourselves, the decisions we make and our commitment to ensure our actions match our words. Excellence: We hold ourselves to the highest standards in everything we do. Continuous Improvement: We are open-minded and continuously pursue new ideas and processes that drive positive change.",
    category: "company"
  },
  {
    title: "Contact Information",
    content: "Complete Credit Solutions contact details: Phone: 1300 930 070, Tel: (02) 8836 4300, International: +61 2 8836 4300. Email addresses: General inquiries: info@completecredit.com.au, Complaints: complaints@completecredit.com.au, Hardship: hardship@completecredit.com.au, Insolvency: insolvency@completecredit.com.au. Address: PO Box W167, Parramatta Westfield Parramatta NSW 2150. Office Hours: Monday to Friday, 8:30am – 5pm AEDT/AEST.",
    category: "contact"
  },
  {
    title: "Financial Hardship Assistance",
    content: "We all face unexpected circumstances that affect our financial position from time to time. At Complete Credit Solutions we focus on helping you meet your obligations, within your current financial means. We have numerous options available to assist our customers in reaching financial recovery. Our staff will assist you with respect and dignity, and work with you to achieve the best outcome for you in the immediate and long term. You can submit a Financial Hardship Assistance Form online or contact our hardship team at hardship@completecredit.com.au.",
    category: "hardship"
  },
  {
    title: "Making a Payment",
    content: "Customers can make payments through our secure online payment portal. If you're having difficulty making a payment, please contact us to discuss payment arrangement options. We're here to help find a solution that works for your current financial situation.",
    category: "payments"
  },
  {
    title: "Customer Authorisation",
    content: "If you would like to authorise someone else to speak on your behalf regarding your account, you can submit a customer authorisation form. This allows a trusted person to discuss your account details and make arrangements with us on your behalf.",
    category: "account"
  },
  {
    title: "Financial Counsellors and Representatives",
    content: "If you're working with a financial counsellor, solicitor, or credit repairer, they can submit a letter of authority on your behalf. We work collaboratively with authorised representatives to find the best outcomes for our customers.",
    category: "representatives"
  },
  {
    title: "Interpreter Services",
    content: "We offer the Translating and Interpreting Service (TIS National) which provides access to phone interpreters in over 150 languages. Call TIS National on 131 450, state the language you require, and ask to be connected to Complete Credit Solutions on (02) 8836 4300. This service is available Monday to Friday, 8am to 5pm.",
    category: "accessibility"
  },
  {
    title: "National Relay Service",
    content: "The National Relay Service (NRS) assists people who are deaf, hard of hearing and/or have speech impairment to communicate. TTY users: Call 133 677 and ask for 02 8836 4300. Speak and Listen users: Call 1300 555 727 and ask for 02 8836 4300. Internet relay users: Connect to the NRS, then ask for 02 8836 4300.",
    category: "accessibility"
  },
  {
    title: "Raising a Complaint",
    content: "Good or bad, we want to hear from you - it's the only way we'll improve. If you have feedback or a complaint, you can contact us through our complaint form or email complaints@completecredit.com.au. We take all feedback seriously and are committed to resolving issues fairly and promptly.",
    category: "complaints"
  },
  {
    title: "Reconciliation Commitment",
    content: "Complete Credit Solutions acknowledges Aboriginal and Torres Strait Islander Peoples as the First Peoples of Australia. We pay respect to the Traditional Owners of the Land on which we meet, live, work and learn, and to the Elders of each Nation – Past, Present and Future. CCS has developed a Reconciliation Action Plan (RAP) to support the national reconciliation movement.",
    category: "company"
  },
  {
    title: "ESG Commitment",
    content: "Complete Credit Solutions is committed to Environmental, Social and Governance (ESG) responsibilities. We ensure our offices are in 5-star NABERS rated buildings, we've reduced electricity and paper usage, we promote mental health and wellness for staff, and we maintain ISO 14001 Environmental Management Systems certification.",
    category: "company"
  }
];

export const bulkImportKnowledge = async () => {
  try {
    const { data, error } = await supabase
      .from('knowledge_base')
      .insert(knowledgeBaseEntries);

    if (error) {
      console.error('Error importing knowledge base:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      message: `Successfully imported ${knowledgeBaseEntries.length} knowledge base entries` 
    };
  } catch (error) {
    console.error('Error importing knowledge base:', error);
    return { success: false, error: 'Failed to import knowledge base entries' };
  }
};

// Helper function to clear existing knowledge base (use with caution!)
export const clearKnowledgeBase = async () => {
  try {
    const { error } = await supabase
      .from('knowledge_base')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) {
      console.error('Error clearing knowledge base:', error);
      return { success: false, error: error.message };
    }

    return { success: true, message: 'Knowledge base cleared successfully' };
  } catch (error) {
    console.error('Error clearing knowledge base:', error);
    return { success: false, error: 'Failed to clear knowledge base' };
  }
};