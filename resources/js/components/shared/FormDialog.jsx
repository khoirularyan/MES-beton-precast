import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Loader2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { toast } from "sonner";

const CreatableCombobox = ({ value, onChange, options, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const filteredOptions = options.filter(o => 
    (o.label || o.value || o).toLowerCase().includes(inputValue.toLowerCase())
  );
  
  const displayValue = value || "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-9 text-sm font-normal text-left px-3 border-[#E2E8F0]"
        >
          {displayValue ? displayValue : <span className="text-[#59687A]">{placeholder || "Pilih / ketik baru..."}</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Cari atau ketik baru..." 
            value={inputValue} 
            onValueChange={setInputValue} 
          />
          <CommandList className="max-h-60">
            <CommandEmpty className="py-3 px-3 text-sm flex flex-col items-center">
              <span className="text-[#59687A] mb-2">Tidak ditemukan.</span>
              {inputValue && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full text-[#0A6ED1] border-[#0A6ED1]"
                  onClick={() => {
                    onChange(inputValue);
                    setOpen(false);
                    setInputValue("");
                  }}
                >
                  Gunakan "{inputValue}"
                </Button>
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((opt) => {
                const optVal = opt.value || opt;
                const optLabel = opt.label || opt;
                return (
                  <CommandItem
                    key={optVal}
                    value={optVal}
                    onSelect={() => {
                      onChange(optVal);
                      setOpen(false);
                      setInputValue("");
                    }}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${value === optVal ? "opacity-100" : "opacity-0"}`}
                    />
                    {optLabel}
                  </CommandItem>
                );
              })}
              {inputValue && !filteredOptions.some(o => (o.label || o.value || o).toLowerCase() === inputValue.toLowerCase()) && (
                <CommandItem
                  value={`__new_${inputValue}`}
                  onSelect={() => {
                    onChange(inputValue);
                    setOpen(false);
                    setInputValue("");
                  }}
                  className="text-[#0A6ED1] font-medium"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah "{inputValue}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

/**
 * Generic form dialog for create/edit actions across the app.
 * Props:
 *   trigger      - ReactNode (the button)
 *   title        - dialog title
 *   description  - sub-text
 *   fields       - [{ name, label, type: 'text'|'number'|'date'|'select'|'textarea', options?, placeholder?, span?: 1|2, required? }]
 *   submitLabel  - default "Save"
 *   successMessage - toast text on submit
 *   testId       - prefix for data-testid
 *   onSubmit     - async function(data) - custom submit handler, if not provided shows default toast
 */
export const FormDialog = ({
  trigger,
  title,
  description,
  fields = [],
  submitLabel = "Save",
  successMessage = "Data saved successfully",
  testId = "form-dialog",
  onSubmit,
  initialValues = {},
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [values, setValues] = useState(initialValues);
  const [submitting, setSubmitting] = useState(false);

  // Use controlled or internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  // Update values when initialValues change (for edit mode)
  useEffect(() => {
    if (Object.keys(initialValues).length > 0) {
      setValues(initialValues);
    }
  }, [initialValues]);

  const handleChange = (name, val) => setValues((v) => ({ ...v, [name]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const missingFields = fields
      .filter((f) => f.required && !values[f.name])
      .map((f) => f.label);
    
    if (missingFields.length > 0) {
      toast.error("Missing required fields", {
        description: `Please fill in: ${missingFields.join(", ")}`,
      });
      return;
    }

    // If custom onSubmit provided, use it (async)
    if (onSubmit) {
      try {
        setSubmitting(true);
        await onSubmit(values);
        setOpen(false);
        setValues({});
      } catch (err) {
        console.error("Form submission error:", err);
        // Error toast handled by the onSubmit function
      } finally {
        setSubmitting(false);
      }
    } else {
      // Default behavior: just show toast
      toast.success(successMessage, {
        description: `Data saved on ${new Date().toLocaleString("en-US")}`,
      });
      setOpen(false);
      setValues({});
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden" data-testid={`${testId}-content`}>
        <DialogHeader>
          <DialogTitle className="text-base font-display">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-xs">{description}</DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 py-2 max-h-[58vh] overflow-y-auto pr-2">
            {fields.map((f) => (
              <div key={f.name} className={f.span === 2 ? "col-span-2" : "col-span-2 md:col-span-1"}>
                <Label htmlFor={f.name} className="text-xs font-medium text-[#1C252E] mb-1.5 block">
                  {f.label} {f.required && <span className="text-[#B00020]">*</span>}
                </Label>
                {f.type === "textarea" ? (
                  <Textarea
                    id={f.name}
                    data-testid={`${testId}-field-${f.name}`}
                    placeholder={f.placeholder}
                    value={values[f.name] || ""}
                    onChange={(e) => handleChange(f.name, e.target.value)}
                    className="text-sm min-h-[72px]"
                  />
                ) : f.type === "select" ? (
                  <Select 
                    value={values[f.name] !== undefined ? String(values[f.name]) : ""} 
                    onValueChange={(v) => {
                      const opt = f.options.find(o => String(o.value !== undefined ? o.value : o) === v);
                      const parsedValue = opt && typeof opt.value === 'boolean' ? (v === 'true') : v;
                      handleChange(f.name, parsedValue);
                    }}
                  >
                    <SelectTrigger className="h-9 text-sm" data-testid={`${testId}-field-${f.name}`}>
                      <SelectValue placeholder={f.placeholder || "Pilih..."} />
                    </SelectTrigger>
                    <SelectContent position="popper" side="bottom" sideOffset={5} className="max-h-[300px] overflow-y-auto">
                      {f.options.map((o) => {
                        const val = o.value !== undefined ? String(o.value) : String(o);
                        return (
                          <SelectItem key={val} value={val} className="text-sm">
                            {o.label || o}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                ) : f.type === "datalist" ? (
                  <CreatableCombobox
                    value={values[f.name]}
                    onChange={(val) => handleChange(f.name, val)}
                    options={f.options}
                    placeholder={f.placeholder}
                  />
                ) : f.type === "multiselect" ? (
                  <div className="space-y-2">
                    {f.options.map((o) => {
                      const selected = (values[f.name] || []).includes(o.value);
                      return (
                        <label key={o.value} className="flex items-center gap-2 text-sm text-[#1C252E]">
                          <Checkbox
                            checked={selected}
                            onCheckedChange={(checked) => {
                              const current = values[f.name] || [];
                              const next = checked
                                ? [...current, o.value]
                                : current.filter((v) => v !== o.value);
                              handleChange(f.name, next);
                            }}
                            id={`${f.name}-${o.value}`}
                          />
                          <span>{o.label}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  f.type === "file" ? (
                    <div className="space-y-2">
                      {values[f.name] && typeof values[f.name] === "string" && (
                        <div className="flex items-center gap-2 border border-[#DFE3E8] rounded p-2 bg-[#F8FAFC]">
                          <img
                            src={values[f.name]}
                            alt="Current Preview"
                            className="w-12 h-12 object-cover rounded border border-[#DFE3E8]"
                          />
                          <span className="text-xs text-[#59687A] truncate max-w-[200px]">
                            Gambar Saat Ini
                          </span>
                        </div>
                      )}
                      <Input
                        id={f.name}
                        data-testid={`${testId}-field-${f.name}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleChange(f.name, e.target.files[0])}
                        className="h-9 text-sm file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#F0F7FF] file:text-[#0A6ED1] hover:file:bg-[#E0F0FF]"
                      />
                    </div>
                  ) : (
                    <Input
                      id={f.name}
                      data-testid={`${testId}-field-${f.name}`}
                      type={f.type || "text"}
                      placeholder={f.placeholder}
                      value={values[f.name] || ""}
                      onChange={(e) => handleChange(f.name, e.target.value)}
                      className="h-9 text-sm"
                    />
                  )
                )}
              </div>
            ))}
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              data-testid={`${testId}-cancel`}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-[#0A6ED1] hover:bg-[#0854A1]"
              data-testid={`${testId}-submit`}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FormDialog;
