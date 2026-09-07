<script lang="ts">
  import { dict } from '@/discovery/ui/intl'
  import { Document } from '@/discovery/ui'
  import source from '../../docs/multipart.md?raw'
</script>

<Document {source} title={$dict.guide.multipart.title} />
