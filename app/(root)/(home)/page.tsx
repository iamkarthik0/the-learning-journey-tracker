import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyP,
  TypographyBlockquote,
  TypographyList,
  TypographyInlineCode,
  TypographyLead,
  TypographyLarge,
  TypographySmall,
  TypographyMuted,
  TypographyTable,
} from "@/components/ui/typography";

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <TypographyH1>Taxing Laughter: The Joke Tax Chronicles</TypographyH1>
        
        <TypographyLead>
          A modal dialog that interrupts the user with important content and expects a response.
        </TypographyLead>

        <TypographyP>
          Once upon a time, in a far-off land, there was a very lazy king who spent all day lounging on his throne. One day, his advisors came to him with a problem: the kingdom was running out of money.
        </TypographyP>

        <TypographyH2>The King's Plan</TypographyH2>

        <TypographyP>
          The king thought long and hard, and finally came up with a brilliant plan: he would tax the jokes in the kingdom.
        </TypographyP>

        <TypographyBlockquote>
          "After all," he said, "everyone enjoys a good joke, so it's only fair that they should pay for the privilege."
        </TypographyBlockquote>

        <TypographyH3>The Joke Tax</TypographyH3>

        <TypographyP>
          The king's subjects were not amused. They grumbled and complained, but the king was firm:
        </TypographyP>

        <TypographyList>
          <li>1st level of puns: 5 gold coins</li>
          <li>2nd level of jokes: 10 gold coins</li>
          <li>3rd level of one-liners: 20 gold coins</li>
        </TypographyList>

        <TypographyP>
          As a result, people stopped telling jokes, and the kingdom fell into a gloom. But there was one person who refused to let the king's foolishness get him down: a court jester named Jokester.
        </TypographyP>

        <TypographyH3>Jokester's Revolt</TypographyH3>

        <TypographyP>
          Jokester began sneaking into the castle in the middle of the night and leaving jokes all over the place: under the king's pillow, in his soup, even in the royal toilet. The king was furious, but he couldn't seem to stop Jokester.
        </TypographyP>

        <TypographyH4>People stopped telling jokes</TypographyH4>

        <TypographyP>
          The people of the kingdom, feeling uplifted by the laughter, started to tell jokes and puns again, and soon the entire kingdom was in on the joke.
        </TypographyP>

        <TypographyTable />

        <TypographyP>
          The king, seeing how much happier his subjects were, realized the error of his ways and repealed the joke tax. Jokester was declared a hero, and the kingdom lived happily ever after.
        </TypographyP>

        <TypographyP>
          The moral of the story is: never underestimate the power of a good laugh and always be careful of bad ideas.
        </TypographyP>

        {/* Typography Components Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Typography Components</CardTitle>
            <CardDescription>All Shadcn typography components</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <TypographySmall>Small Text</TypographySmall>
              <TypographyMuted>Muted text for less important information</TypographyMuted>
            </div>
            
            <div>
              <TypographyLarge>Are you absolutely sure?</TypographyLarge>
            </div>

            <div>
              <TypographyP>
                This is a paragraph with <TypographyInlineCode>inline code</TypographyInlineCode> inside it.
              </TypographyP>
            </div>
          </CardContent>
        </Card>

        {/* Typography Scale Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Typography Scale (12/14/16/18/24/30/36)</CardTitle>
            <CardDescription>Design system font sizes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs">Extra Small - 12px (text-xs)</p>
            <p className="text-sm">Small - 14px (text-sm)</p>
            <p className="text-base">Base - 16px (text-base)</p>
            <p className="text-lg">Large - 18px (text-lg)</p>
            <p className="text-xl">Extra Large - 24px (text-xl)</p>
            <p className="text-2xl">2XL - 30px (text-2xl)</p>
            <p className="text-3xl">3XL - 36px (text-3xl)</p>
          </CardContent>
        </Card>

        {/* Spacing Scale Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Spacing Scale (4/8/12/16/24/32)</CardTitle>
            <CardDescription>Design system spacing with visual bars</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="w-1 h-8 bg-primary"></div>
                <span className="text-sm">4px (p-1, m-1, gap-1)</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-2 h-8 bg-primary"></div>
                <span className="text-sm">8px (p-2, m-2, gap-2)</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-3 h-8 bg-primary"></div>
                <span className="text-sm">12px (p-3, m-3, gap-3)</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-4 h-8 bg-primary"></div>
                <span className="text-sm">16px (p-4, m-4, gap-4)</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-6 h-8 bg-primary"></div>
                <span className="text-sm">24px (p-6, m-6, gap-6)</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-primary"></div>
                <span className="text-sm">32px (p-8, m-8, gap-8)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spacing Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Spacing in Action</CardTitle>
            <CardDescription>Real examples using design system spacing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Padding Examples */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Padding Examples</h3>
                <div className="flex flex-wrap gap-4">
                  <div className="p-1 bg-secondary border">p-1 (4px)</div>
                  <div className="p-2 bg-secondary border">p-2 (8px)</div>
                  <div className="p-3 bg-secondary border">p-3 (12px)</div>
                  <div className="p-4 bg-secondary border">p-4 (16px)</div>
                  <div className="p-6 bg-secondary border">p-6 (24px)</div>
                  <div className="p-8 bg-secondary border">p-8 (32px)</div>
                </div>
              </div>

              {/* Gap Examples */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Gap Examples</h3>
                <div className="space-y-4">
                  <div className="flex gap-1 flex-wrap">
                    <Button size="sm">gap-1</Button>
                    <Button size="sm">4px</Button>
                    <Button size="sm">gap</Button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm">gap-2</Button>
                    <Button size="sm">8px</Button>
                    <Button size="sm">gap</Button>
                  </div>
                  <div className="flex gap-4 flex-wrap">
                    <Button size="sm">gap-4</Button>
                    <Button size="sm">16px</Button>
                    <Button size="sm">gap</Button>
                  </div>
                  <div className="flex gap-6 flex-wrap">
                    <Button size="sm">gap-6</Button>
                    <Button size="sm">24px</Button>
                    <Button size="sm">gap</Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Button Sizes */}
        <Card>
          <CardHeader>
            <CardTitle>Button Sizes</CardTitle>
            <CardDescription>Shadcn buttons with design system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-center">
              <Button size="xs">Extra Small</Button>
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
            </div>
          </CardContent>
        </Card>

        {/* Responsive Example */}
        <Card>
          <CardHeader>
            <CardTitle>Responsive Design</CardTitle>
            <CardDescription>Using Tailwind responsive classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 md:p-6 lg:p-8 bg-secondary border">
                <p className="text-sm md:text-base lg:text-lg">
                  This box has responsive padding: p-4 (mobile) → p-6 (tablet) → p-8 (desktop)
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm">Card 1</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm">Card 2</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm">Card 3</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
