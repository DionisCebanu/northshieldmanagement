import { UserRound, MapPin, Phone, BriefcaseBusiness, GraduationCap } from 'lucide-react';
import { useClient } from '@/contexts/client-context';
import { EditableProfileSection, PROVINCE_OPTIONS, EMPLOYMENT_STATUS_OPTIONS, BOOLEAN_OPTIONS, type EditableField } from '@/components/customer/editable-profile-section';
import { humanize } from '@/lib/banking-format';
import { isValidEmail, isValidCanadianPostalCode, isValidPhoneNumber, isPastOrTodayDate, orNull } from '@/lib/validation';

export function ProfileInformation() {
  const { workspace, updateClient } = useClient();
  if (!workspace) return null;
  const c = workspace.client;

  const personalFields: EditableField[] = [
    { key: 'firstName', label: 'First name', type: 'text', required: true },
    { key: 'lastName', label: 'Last name', type: 'text', required: true },
    { key: 'dateOfBirth', label: 'Date of birth', type: 'date', required: true },
    { key: 'clientId', label: 'Client ID', readOnly: true },
    { key: 'status', label: 'Customer status', readOnly: true },
  ];
  const personalValues = { firstName: c.firstName, lastName: c.lastName, dateOfBirth: c.dateOfBirth, clientId: String(c.id), status: humanize(c.status) };
  const personalValidate = (v: Record<string, string>) => {
    const e: Record<string, string> = {};
    if (!v.firstName.trim()) e.firstName = 'First name is required.';
    if (!v.lastName.trim()) e.lastName = 'Last name is required.';
    if (!isPastOrTodayDate(v.dateOfBirth)) e.dateOfBirth = 'Enter a valid date of birth.';
    return e;
  };
  const savePersonal = (v: Record<string, string>) => void updateClient({ firstName: v.firstName.trim(), lastName: v.lastName.trim(), dateOfBirth: v.dateOfBirth });

  const addressFields: EditableField[] = [
    { key: 'street', label: 'Street', type: 'text', required: true },
    { key: 'unit', label: 'Unit', type: 'text' },
    { key: 'city', label: 'City', type: 'text', required: true },
    { key: 'province', label: 'Province', type: 'select', options: PROVINCE_OPTIONS, required: true },
    { key: 'postalCode', label: 'Postal code', type: 'text', required: true },
    { key: 'country', label: 'Country', type: 'text', required: true },
  ];
  const addressValues = { street: c.address.street, unit: c.address.unit ?? '', city: c.address.city, province: c.address.province, postalCode: c.address.postalCode, country: c.address.country };
  const addressValidate = (v: Record<string, string>) => {
    const e: Record<string, string> = {};
    if (!v.street.trim()) e.street = 'Street is required.';
    if (!v.city.trim()) e.city = 'City is required.';
    if (!isValidCanadianPostalCode(v.postalCode)) e.postalCode = 'Enter a valid Canadian postal code (e.g. H1A 1A1).';
    if (!v.country.trim()) e.country = 'Country is required.';
    return e;
  };
  const saveAddress = (v: Record<string, string>) => void updateClient({ address: { ...c.address, street: v.street.trim(), unit: orNull(v.unit), city: v.city.trim(), province: v.province, postalCode: v.postalCode.toUpperCase(), country: v.country.trim() } });

  const contactFields: EditableField[] = [
    { key: 'email', label: 'Email address', type: 'email', required: true },
    { key: 'mobilePhone', label: 'Mobile phone', type: 'tel' },
    { key: 'homePhone', label: 'Home phone', type: 'tel' },
  ];
  const contactValues = { email: c.contact.email, mobilePhone: c.contact.mobilePhone ?? '', homePhone: c.contact.homePhone ?? '' };
  const contactValidate = (v: Record<string, string>) => {
    const e: Record<string, string> = {};
    if (!isValidEmail(v.email)) e.email = 'Enter a valid email address.';
    if (!isValidPhoneNumber(v.mobilePhone)) e.mobilePhone = 'Enter a valid phone number.';
    if (!isValidPhoneNumber(v.homePhone)) e.homePhone = 'Enter a valid phone number.';
    return e;
  };
  const saveContact = (v: Record<string, string>) => void updateClient({ contact: { ...c.contact, email: v.email.trim(), mobilePhone: orNull(v.mobilePhone), homePhone: orNull(v.homePhone) } });

  const employmentFields: EditableField[] = [
    { key: 'status', label: 'Employment status', type: 'select', options: EMPLOYMENT_STATUS_OPTIONS, required: true },
    { key: 'employer', label: 'Employer', type: 'text' },
    { key: 'occupation', label: 'Occupation', type: 'text' },
  ];
  const employmentValues = { status: c.employment.status, employer: c.employment.employer ?? '', occupation: c.employment.occupation ?? '' };
  const saveEmployment = (v: Record<string, string>) => void updateClient({ employment: { ...c.employment, status: v.status, employer: orNull(v.employer), occupation: orNull(v.occupation) } });

  const studentFields: EditableField[] = [
    { key: 'isStudent', label: 'Student status', type: 'select', options: BOOLEAN_OPTIONS, required: true },
    { key: 'institution', label: 'Institution', type: 'text' },
    { key: 'program', label: 'Program', type: 'text' },
  ];
  const studentValues = { isStudent: String(c.student.isStudent), institution: c.student.institution ?? '', program: c.student.program ?? '' };
  const saveStudent = (v: Record<string, string>) => void updateClient({ student: { ...c.student, isStudent: v.isStudent === 'true', institution: orNull(v.institution), program: orNull(v.program) } });

  return (
    <div className="profile-grid">
      <EditableProfileSection title="Personal information" icon={UserRound} fields={personalFields} values={personalValues} validate={personalValidate} onSave={savePersonal} />
      <EditableProfileSection title="Address" icon={MapPin} fields={addressFields} values={addressValues} validate={addressValidate} onSave={saveAddress} />
      <EditableProfileSection title="Contact information" icon={Phone} fields={contactFields} values={contactValues} validate={contactValidate} onSave={saveContact} />
      <EditableProfileSection title="Employment information" icon={BriefcaseBusiness} fields={employmentFields} values={employmentValues} onSave={saveEmployment} />
      <EditableProfileSection title="Student information" icon={GraduationCap} fields={studentFields} values={studentValues} onSave={saveStudent} />
    </div>
  );
}
