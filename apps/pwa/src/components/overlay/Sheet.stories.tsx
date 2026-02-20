import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "./Sheet";
import { Button } from "@/components/form/Button";
import { Input } from "@/components/form/Input";
import { Label } from "@/components/form/Label";

const meta = {
  title: "Overlay/Sheet",
  component: Sheet,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

function RightSheetStory() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">Open Right Sheet</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" defaultValue="John Doe" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input id="username" defaultValue="@johndoe" className="col-span-3" />
          </div>
        </div>
        <SheetFooter>
          <Button onClick={() => setOpen(false)}>Save changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export const Right: Story = {
  render: () => <RightSheetStory />,
};

function LeftSheetStory() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">Open Left Sheet</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>Menu items go here.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <Button variant="ghost" className="justify-start">
            Home
          </Button>
          <Button variant="ghost" className="justify-start">
            About
          </Button>
          <Button variant="ghost" className="justify-start">
            Contact
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export const Left: Story = {
  render: () => <LeftSheetStory />,
};

function TopSheetStory() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">Open Top Sheet</Button>
      </SheetTrigger>
      <SheetContent side="top">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>You have 3 new notifications.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="text-sm">Notification 1</div>
          <div className="text-sm">Notification 2</div>
          <div className="text-sm">Notification 3</div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export const Top: Story = {
  render: () => <TopSheetStory />,
};

function BottomSheetStory() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">Open Bottom Sheet</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Actions</SheetTitle>
          <SheetDescription>Choose an action to perform.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <Button>Action 1</Button>
          <Button variant="outline">Action 2</Button>
          <Button variant="outline">Action 3</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export const Bottom: Story = {
  render: () => <BottomSheetStory />,
};
