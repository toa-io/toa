<script lang="ts">
  import { Textarea } from '$ui/textarea'
  import { Label } from '$ui/label'
  import { Input } from '$ui/input'
  import { hint } from './request'
  import { dict } from './intl'
  import { id, type Props } from './Form'

  let { fields, values, body = $bindable(''), carries, invalid, disabled = false }: Props =
    $props()

  /** What a resource says of a parameter, where the `help` family gave it words. */
  function said(schema: Record<string, unknown> | null, key: string): string | null {
    const value = schema?.[key]

    return typeof value === 'string' ? value : null
  }
</script>

<div class="flex flex-col gap-3">
  {#each fields as field (field.key)}
    <div class="flex flex-col gap-1.5">
      <Label for={id(field.key)} class="gap-1.5">
        <span class="font-mono text-xs">{field.name}</span>

        {#if said(field.schema, 'title') !== null}
          <span class="text-muted-foreground text-xs font-normal">
            {said(field.schema, 'title')}
          </span>
        {/if}
      </Label>

      <Input
        id={id(field.key)}
        bind:value={values[field.key]}
        placeholder={hint(field.schema)}
        {disabled}
        class="font-mono text-xs"
      />

      {#if said(field.schema, 'description') !== null}
        <p class="text-muted-foreground text-xs">{said(field.schema, 'description')}</p>
      {/if}
    </div>
  {/each}

  {#if carries}
    <div class="flex flex-col gap-1.5">
      <Label for="discovery-body-textarea" class="font-mono text-xs">
        {$dict.resource.input}
      </Label>

      <!-- what the schema says it takes, to be edited rather than written out -->
      <Textarea
        id="discovery-body-textarea"
        bind:value={body}
        aria-invalid={invalid}
        {disabled}
        rows={8}
        class="max-h-64 font-mono text-xs"
      />

      {#if invalid}
        <p class="text-destructive text-xs">{$dict.call.invalid}</p>
      {/if}
    </div>
  {/if}
</div>
