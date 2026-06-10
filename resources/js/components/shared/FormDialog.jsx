import { useState } from "react";
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
import { toast } from "sonner";

/**
 * Generic form dialog for create/edit actions across the app.
 * Props:
 *   trigger      - ReactNode (the button)
 *   title        - dialog title
 *   description  - sub-text
 *   fields       - [{ name, label, type: 'text'|'number'|'date'|'select'|'textarea', options?, placeholder?, span?: 1|2, required? }]
 *   submitLabel  - default "Simpan"
 *   successMessage - toast text on submit
 *   testId       - prefix for data-testid
 */
export const FormDialog = ({
  trigger,
  title,
  description,
  fields = [],
  submitLabel = "Save",
  successMessage = "Data saved successfully",
  testId = "form-dialog",
}) => {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({});

  const handleChange = (name, val) => setValues((v) => ({ ...v, [name]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success(successMessage, {
      description: `Data saved on ${new Date().toLocaleString("en-US")}`,
    });
    setOpen(false);
    setValues({});
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
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
                  <Select value={values[f.name] || ""} onValueChange={(v) => handleChange(f.name, v)}>
                    <SelectTrigger className="h-9 text-sm" data-testid={`${testId}-field-${f.name}`}>
                      <SelectValue placeholder={f.placeholder || "Pilih..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options.map((o) => (
                        <SelectItem key={o.value || o} value={o.value || o} className="text-sm">
                          {o.label || o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Input
                    id={f.name}
                    data-testid={`${testId}-field-${f.name}`}
                    type={f.type || "text"}
                    placeholder={f.placeholder}
                    value={values[f.name] || ""}
                    onChange={(e) => handleChange(f.name, e.target.value)}
                    className="h-9 text-sm"
                  />
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
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-[#0A6ED1] hover:bg-[#0854A1]"
              data-testid={`${testId}-submit`}
            >
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FormDialog;
