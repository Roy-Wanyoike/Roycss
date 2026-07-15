"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Container,
  Grid,
  Stack,
  Card,
  Badge,
  Avatar,
  Input,
  Select,
  Checkbox,
  Toggle,
  FormField,
  Tabs,
  Breadcrumb,
  Pagination,
  Alert,
  Progress,
  Skeleton,
  Spinner,
  BarChart,
  LineChart,
  DonutChart,
  StatCard,
  Typography,
  Heading,
  Text,
  Caption,
  Code,
  useToast,
  ToastContainer,
} from "@/components/ui-library";
import {
  Search,
  Bell,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Mail,
} from "lucide-react";

export function ComponentShowcase() {
  const [toggleOn, setToggleOn] = useState(true);
  const [checkbox, setCheckbox] = useState(false);
  const [page, setPage] = useState(3);
  const { toasts, dismiss, toast } = useToast();

  return (
    <Container maxWidth="xl" className="py-12 space-y-16">
      {/* Header */}
      <div className="text-center">
        <Badge variant="primary" size="lg" dot pulse>
          Component Library
        </Badge>
        <Heading level={1} scale="display" size="4xl" className="mt-4">
          RoyCSS Components
        </Heading>
        <Text size="lg" className="text-muted-foreground mt-2 max-w-xl mx-auto">
          Production-ready React components built on RoyCSS design tokens. OKLCH colors, container queries, full accessibility.
        </Text>
      </div>

      {/* Foundation: Typography */}
      <ShowcaseSection title="Foundation" subtitle="Typography & Design Tokens">
        <Grid cols={2} gap="lg">
          <Card padding="lg">
            <Stack gap="sm">
              <Heading level={2} size="2xl">Heading 2xl</Heading>
              <Heading level={3} size="xl">Heading xl</Heading>
              <Heading level={4} size="lg">Heading lg</Heading>
              <Text size="base">Body text — base size</Text>
              <Text size="sm">Small text — sm size</Text>
              <Caption>Caption text</Caption>
              <Code>npm install roycss</Code>
              <Typography gradient size="2xl" weight="bold">Gradient Text</Typography>
            </Stack>
          </Card>
          <Card padding="lg">
            <Stack gap="sm">
              <Text weight="semibold" className="text-muted-foreground">Color Tokens</Text>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { name: "Primary", color: "bg-primary" },
                  { name: "Secondary", color: "bg-secondary" },
                  { name: "Success", color: "bg-success" },
                  { name: "Warning", color: "bg-warning" },
                  { name: "Danger", color: "bg-danger" },
                  { name: "Info", color: "bg-info" },
                  { name: "Surface", color: "bg-surface" },
                  { name: "Muted", color: "bg-muted" },
                ].map((c) => (
                  <div key={c.name} className="space-y-1">
                    <div className={`h-12 rounded-lg ${c.color}`} />
                    <Caption>{c.name}</Caption>
                  </div>
                ))}
              </div>
            </Stack>
          </Card>
        </Grid>
      </ShowcaseSection>

      {/* Layout */}
      <ShowcaseSection title="Layout" subtitle="Container, Grid, Stack">
        <Card padding="lg">
          <Grid cols={3} gap="md" responsive>
            <div className="p-4 rounded-lg bg-primary/10 text-center">
              <Text size="sm" weight="semibold">Grid Col 1</Text>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 text-center">
              <Text size="sm" weight="semibold">Grid Col 2</Text>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 text-center">
              <Text size="sm" weight="semibold">Grid Col 3</Text>
            </div>
          </Grid>
          <div className="mt-4">
            <Stack direction="row" gap="sm" align="center">
              <Badge variant="primary">Stack Row</Badge>
              <Badge variant="success">Aligned</Badge>
              <Badge variant="warning">Centered</Badge>
            </Stack>
          </div>
        </Card>
      </ShowcaseSection>

      {/* Forms */}
      <ShowcaseSection title="Forms" subtitle="Input, Select, Checkbox, Toggle">
        <Grid cols={2} gap="lg">
          <Card padding="lg">
            <Stack gap="md">
              <FormField label="Email" hint="We'll never share your email" required>
                <Input type="email" placeholder="you@example.com" icon={Mail} />
              </FormField>
              <FormField label="Password" error="Password too short">
                <Input type="password" placeholder="••••••••" error />
              </FormField>
              <FormField label="Role">
                <Select
                  options={[
                    { value: "admin", label: "Admin" },
                    { value: "user", label: "User" },
                    { value: "guest", label: "Guest" },
                  ]}
                />
              </FormField>
            </Stack>
          </Card>
          <Card padding="lg">
            <Stack gap="md">
              <FormField label="Search">
                <Input variant="filled" placeholder="Search..." icon={Search} />
              </FormField>
              <Checkbox
                label="Accept terms and conditions"
                checked={checkbox}
                onChange={(e) => setCheckbox(e.target.checked)}
              />
              <Toggle
                checked={toggleOn}
                onChange={setToggleOn}
                label="Enable notifications"
                variant="ios"
              />
              <Toggle
                checked={!toggleOn}
                onChange={() => setToggleOn(!toggleOn)}
                label="Material variant"
                variant="material"
              />
            </Stack>
          </Card>
        </Grid>
      </ShowcaseSection>

      {/* Navigation */}
      <ShowcaseSection title="Navigation" subtitle="Tabs, Breadcrumb, Pagination">
        <Card padding="lg">
          <Stack gap="lg">
            <Tabs
              variant="underline"
              items={[
                { id: "overview", label: "Overview", content: <Text size="sm">Overview content goes here.</Text> },
                { id: "analytics", label: "Analytics", content: <Text size="sm">Analytics content goes here.</Text> },
                { id: "settings", label: "Settings", content: <Text size="sm">Settings content goes here.</Text> },
              ]}
            />
            <Breadcrumb
              items={[
                { label: "Home", href: "#" },
                { label: "Settings", href: "#" },
                { label: "Profile" },
              ]}
            />
            <Pagination total={10} current={page} onPageChange={setPage} />
          </Stack>
        </Card>
      </ShowcaseSection>

      {/* Feedback */}
      <ShowcaseSection title="Feedback" subtitle="Alert, Progress, Skeleton, Spinner, Toast">
        <Stack gap="md">
          <Alert severity="success" title="Success!" dismissible>
            Your changes have been saved successfully.
          </Alert>
          <Alert severity="warning" title="Warning">
            Your subscription expires in 3 days.
          </Alert>
          <Grid cols={2} gap="lg">
            <Card padding="lg">
              <Stack gap="md">
                <Text weight="semibold">Progress Bars</Text>
                <Progress value={75} color="primary" label />
                <Progress value={40} color="success" label />
                <Progress value={90} color="warning" label />
                <Progress value={25} color="danger" label />
              </Stack>
            </Card>
            <Card padding="lg">
              <Stack gap="md" align="center">
                <Text weight="semibold">Circular Progress</Text>
                <Stack direction="row" gap="lg">
                  <Progress value={60} variant="circular" size="lg" color="primary" label />
                  <Progress value={85} variant="circular" size="lg" color="success" label />
                  <Progress value={30} variant="circular" size="lg" color="danger" label />
                </Stack>
              </Stack>
            </Card>
          </Grid>
          <Grid cols={3} gap="md">
            <Card padding="lg">
              <Stack gap="sm">
                <Text weight="semibold">Skeleton</Text>
                <Skeleton variant="circle" width={40} height={40} />
                <Skeleton variant="text" lines={3} />
              </Stack>
            </Card>
            <Card padding="lg">
              <Stack gap="sm" align="center">
                <Text weight="semibold">Spinners</Text>
                <Stack direction="row" gap="md">
                  <Spinner size="sm" />
                  <Spinner size="md" />
                  <Spinner size="lg" color="muted" />
                </Stack>
              </Stack>
            </Card>
            <Card padding="lg">
              <Stack gap="sm" align="center">
                <Text weight="semibold">Toast Trigger</Text>
                <Stack direction="row" gap="sm">
                  <button onClick={() => toast("Saved!", "success")} className="px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-medium cursor-pointer hover:bg-success/20 transition-colors">Success</button>
                  <button onClick={() => toast("Check input", "warning")} className="px-3 py-1.5 rounded-lg bg-warning/10 text-warning text-xs font-medium cursor-pointer hover:bg-warning/20 transition-colors">Warning</button>
                  <button onClick={() => toast("Failed!", "danger")} className="px-3 py-1.5 rounded-lg bg-danger/10 text-danger text-xs font-medium cursor-pointer hover:bg-danger/20 transition-colors">Danger</button>
                </Stack>
              </Stack>
            </Card>
          </Grid>
        </Stack>
      </ShowcaseSection>

      {/* Data Display */}
      <ShowcaseSection title="Data Display" subtitle="Card, Badge, Avatar, Table">
        <Grid cols={2} gap="lg">
          <Card hover="lift" padding="lg">
            <Card.Header>
              <Stack direction="row" justify="between" align="center">
                <Heading level={4}>Card with Hover Lift</Heading>
                <Badge variant="success" dot>New</Badge>
              </Stack>
            </Card.Header>
            <Card.Body>
              <Text size="sm" className="text-muted-foreground">
                This card lifts on hover. Variants: default, glass, outline, elevated.
              </Text>
            </Card.Body>
            <Card.Footer>
              <Stack direction="row" gap="sm">
                <Avatar fallback="RW" size="sm" status="online" />
                <Caption>Roy Wanyoike · 2h ago</Caption>
              </Stack>
            </Card.Footer>
          </Card>

          <Card padding="lg">
            <Stack gap="sm">
              <Text weight="semibold">Badge Variants</Text>
              <Stack direction="row" gap="sm" wrap>
                <Badge>Default</Badge>
                <Badge variant="primary">Primary</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="danger">Danger</Badge>
                <Badge variant="info">Info</Badge>
                <Badge variant="outline">Outline</Badge>
              </Stack>
              <Text weight="semibold" className="mt-2">Avatars</Text>
              <Stack direction="row" gap="sm">
                <Avatar fallback="A" size="xs" />
                <Avatar fallback="B" size="sm" ring />
                <Avatar fallback="CD" size="md" />
                <Avatar fallback="EF" size="lg" />
                <Avatar fallback="GH" size="xl" ring />
              </Stack>
            </Stack>
          </Card>
        </Grid>
      </ShowcaseSection>

      {/* Charts & Dashboard */}
      <ShowcaseSection title="Charts & Dashboard" subtitle="BarChart, LineChart, DonutChart, StatCard">
        <Stack gap="lg">
          <Grid cols={4} gap="md" responsive>
            <StatCard label="Revenue" value="$12.5k" trend={{ value: 12, label: "vs last month" }} icon={DollarSign} variant="success" />
            <StatCard label="Users" value="8,420" trend={{ value: 8, label: "vs last month" }} icon={Users} />
            <StatCard label="Activity" value="99.9%" trend={{ value: -2, label: "vs last month" }} icon={Activity} variant="danger" />
            <StatCard label="Growth" value="23%" trend={{ value: 5, label: "vs last month" }} icon={TrendingUp} variant="success" />
          </Grid>

          <Grid cols={3} gap="lg" responsive>
            <Card padding="lg">
              <Heading level={4} size="sm" className="mb-4">Bar Chart</Heading>
              <BarChart
                data={[
                  { label: "Mon", value: 40 },
                  { label: "Tue", value: 65 },
                  { label: "Wed", value: 50 },
                  { label: "Thu", value: 80 },
                  { label: "Fri", value: 55 },
                  { label: "Sat", value: 70 },
                  { label: "Sun", value: 45 },
                ]}
                height={160}
              />
            </Card>
            <Card padding="lg">
              <Heading level={4} size="sm" className="mb-4">Line Chart</Heading>
              <LineChart
                data={[
                  { label: "Jan", value: 30 },
                  { label: "Feb", value: 45 },
                  { label: "Mar", value: 35 },
                  { label: "Apr", value: 60 },
                  { label: "May", value: 50 },
                  { label: "Jun", value: 75 },
                ]}
                height={160}
              />
            </Card>
            <Card padding="lg">
              <Heading level={4} size="sm" className="mb-4">Donut Chart</Heading>
              <div className="flex items-center justify-center">
                <DonutChart
                  data={[
                    { label: "Desktop", value: 55, color: "oklch(0.697 0.155 162.48)" },
                    { label: "Mobile", value: 30, color: "oklch(0.702 0.117 205.44)" },
                    { label: "Tablet", value: 15, color: "oklch(0.606 0.234 283.17)" },
                  ]}
                  centerLabel="Total"
                  centerValue="8.4k"
                  size={160}
                />
              </div>
            </Card>
          </Grid>
        </Stack>
      </ShowcaseSection>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismiss} position="bottom-right" />
    </Container>
  );
}

function ShowcaseSection({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-6">
        <Heading level={2} size="xl">{title}</Heading>
        {subtitle && <Text size="sm" className="text-muted-foreground mt-1">{subtitle}</Text>}
      </div>
      {children}
    </motion.section>
  );
}
