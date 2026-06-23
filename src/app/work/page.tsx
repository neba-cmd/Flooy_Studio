import { Column, Heading, Meta, Schema, Text } from "@once-ui-system/core";
import { baseURL, person, work } from "@/resources";
import { Projects } from "@/components/work/Projects";

export async function generateMetadata() {
  return Meta.generate({
    title: work.title,
    description: work.description,
    baseURL: baseURL,
    image: `/api/og/generate?title=${encodeURIComponent(work.title)}`,
    path: work.path,
  });
}

export default function Work() {
  return (
    <Column maxWidth="m" gap="24" paddingTop="24">
      <Schema
        as="webPage"
        baseURL={baseURL}
        path={work.path}
        title={work.title}
        description={work.description}
        image={`/api/og/generate?title=${encodeURIComponent(work.title)}`}
        author={{
          name: person.name,
          url: `${baseURL}${work.path}`,
          image: `${baseURL}${person.avatar}`,
        }}
      />
      <Heading marginBottom="m" variant="heading-strong-xl" align="center">
        {work.title}
      </Heading>
      <Text wrap="balance" onBackground="neutral-weak" variant="heading-default-xl" align="center">
        {work.description}
      </Text>
      <Projects />
    </Column>
  );
}
