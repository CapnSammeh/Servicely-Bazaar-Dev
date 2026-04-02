import { useMemo } from 'react'
import { Octokit } from '@octokit/rest'
import { useAuth } from './useAuth'
import { REPO_OWNER, REPO_NAME, MARKETPLACE_PATH } from '../config'

/** Decode base64 content returned by the GitHub Contents API */
export function decodeBase64(str) {
  return decodeURIComponent(
    atob(str.replace(/\s/g, ''))
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  )
}

/** Encode a UTF-8 string to base64 suitable for the GitHub Contents API */
export function encodeBase64(str) {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  )
}

export function useGitHub() {
  const { token } = useAuth()

  const octokit = useMemo(
    () => new Octokit({ auth: token || undefined }),
    [token]
  )

  /** Fetch all items from marketplace/ directory */
  async function fetchAllItems() {
    const { data: entries } = await octokit.rest.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: MARKETPLACE_PATH,
    })

    const dirs = entries.filter((e) => e.type === 'dir')

    const manifests = await Promise.allSettled(
      dirs.map((dir) => fetchManifest(dir.name))
    )

    return manifests
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value)
  }

  /** Fetch a single manifest.json by slug */
  async function fetchManifest(slug) {
    const { data } = await octokit.rest.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: `${MARKETPLACE_PATH}/${slug}/manifest.json`,
    })
    return JSON.parse(decodeBase64(data.content))
  }

  /** Fetch raw XML content for a version */
  async function fetchVersionFile(slug, versionPath) {
    const { data } = await octokit.rest.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: `${MARKETPLACE_PATH}/${slug}/${versionPath}`,
    })
    return decodeBase64(data.content)
  }

  /** Download a file by triggering a browser download */
  function downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  /** Get or create a file in the repo, returns sha if file exists */
  async function getFileSha(path) {
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path,
      })
      return data.sha
    } catch {
      return null
    }
  }

  /** Create or update a file in the repo */
  async function putFile({ path, message, content, sha }) {
    const params = {
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path,
      message,
      content: encodeBase64(content),
    }
    if (sha) params.sha = sha
    const { data } = await octokit.rest.repos.createOrUpdateFileContents(params)
    return data
  }

  /** Create a GitHub issue for a new item, returns issue number */
  async function createIssue({ title, body }) {
    const { data } = await octokit.rest.issues.create({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      title,
      body,
      labels: ['marketplace-item'],
    })
    return data.number
  }

  /** Fetch comments for a GitHub issue */
  async function fetchIssueComments(issueNumber) {
    const { data } = await octokit.rest.issues.listComments({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      issue_number: issueNumber,
      per_page: 100,
    })
    return data
  }

  /** Post a comment on a GitHub issue */
  async function postIssueComment(issueNumber, body) {
    const { data } = await octokit.rest.issues.createComment({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      issue_number: issueNumber,
      body,
    })
    return data
  }

  /**
   * Upload a brand-new marketplace item.
   * Creates manifest.json, version folder + changeset.xml, and a GitHub issue.
   */
  async function uploadNewItem({ name, description, category, tags, versionNotes, xmlContent, authorLogin }) {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    const version = '1.0.0'
    const now = new Date().toISOString()

    // Create GitHub issue first so we have the issue number
    const issueNumber = await createIssue({
      title: `[Marketplace] ${name}`,
      body: `## ${name}\n\n${description}\n\n**Category:** ${category}\n**Author:** @${authorLogin}\n\n---\n_This issue tracks comments for the [${name}](${window.location.origin}/item/${slug}) marketplace item._`,
    })

    const manifest = {
      id: slug,
      name,
      description,
      author: authorLogin,
      category,
      tags: tags.filter(Boolean),
      createdAt: now,
      status: 'pending',
      latestVersion: version,
      issueNumber,
      versions: [
        {
          version,
          path: `v${version}/changeset.xml`,
          notes: versionNotes,
          createdAt: now,
          status: 'pending',
        },
      ],
    }

    // Write manifest.json
    await putFile({
      path: `${MARKETPLACE_PATH}/${slug}/manifest.json`,
      message: `feat: add ${name} to marketplace`,
      content: JSON.stringify(manifest, null, 2),
    })

    // Write first version file
    await putFile({
      path: `${MARKETPLACE_PATH}/${slug}/v${version}/changeset.xml`,
      message: `feat: add ${name} v${version}`,
      content: xmlContent,
    })

    return slug
  }

  /**
   * Upload a new version of an existing item.
   * Updates manifest.json and creates the new version file.
   */
  async function uploadNewVersion({ slug, version, notes, xmlContent }) {
    const manifest = await fetchManifest(slug)
    const manifestPath = `${MARKETPLACE_PATH}/${slug}/manifest.json`
    const manifestSha = await getFileSha(manifestPath)

    const now = new Date().toISOString()
    const updatedManifest = {
      ...manifest,
      // latestVersion stays at the last approved version until this one is approved
      versions: [
        ...manifest.versions,
        {
          version,
          path: `v${version}/changeset.xml`,
          notes,
          createdAt: now,
          status: 'pending',
        },
      ],
    }

    // Write new version file
    await putFile({
      path: `${MARKETPLACE_PATH}/${slug}/v${version}/changeset.xml`,
      message: `feat: add ${manifest.name} v${version}`,
      content: xmlContent,
    })

    // Update manifest
    await putFile({
      path: manifestPath,
      message: `chore: bump ${manifest.name} to v${version}`,
      content: JSON.stringify(updatedManifest, null, 2),
      sha: manifestSha,
    })

    return updatedManifest
  }

  /** Compare two semver strings, returns true if a > b */
  function semverGt(a, b) {
    const pa = a.split('.').map(Number)
    const pb = b.split('.').map(Number)
    for (let i = 0; i < 3; i++) {
      if ((pa[i] || 0) > (pb[i] || 0)) return true
      if ((pa[i] || 0) < (pb[i] || 0)) return false
    }
    return false
  }

  /**
   * Approve a specific version of an item.
   * Marks the version as approved, updates latestVersion if this is newer,
   * and marks the item itself as approved if it was pending.
   */
  async function approveVersion(slug, version) {
    const manifestPath = `${MARKETPLACE_PATH}/${slug}/manifest.json`
    const manifestSha = await getFileSha(manifestPath)
    const manifest = await fetchManifest(slug)

    const updatedVersions = manifest.versions.map((v) =>
      v.version === version ? { ...v, status: 'approved', reviewNote: undefined } : v
    )

    const newLatest =
      manifest.status === 'pending' || semverGt(version, manifest.latestVersion)
        ? version
        : manifest.latestVersion

    const updatedManifest = {
      ...manifest,
      status: 'approved',
      latestVersion: newLatest,
      versions: updatedVersions,
    }

    await putFile({
      path: manifestPath,
      message: `chore: approve ${slug} v${version}`,
      content: JSON.stringify(updatedManifest, null, 2),
      sha: manifestSha,
    })

    return updatedManifest
  }

  /**
   * Reject a specific version (or entire item if it's the first version).
   */
  async function rejectVersion(slug, version, reviewNote) {
    const manifestPath = `${MARKETPLACE_PATH}/${slug}/manifest.json`
    const manifestSha = await getFileSha(manifestPath)
    const manifest = await fetchManifest(slug)

    const updatedVersions = manifest.versions.map((v) =>
      v.version === version ? { ...v, status: 'rejected', reviewNote } : v
    )

    // If the item itself was pending (first submission), mark it rejected too
    const isFirstSubmission = manifest.status === 'pending'
    const updatedManifest = {
      ...manifest,
      ...(isFirstSubmission ? { status: 'rejected', reviewNote } : {}),
      versions: updatedVersions,
    }

    await putFile({
      path: manifestPath,
      message: `chore: reject ${slug} v${version}`,
      content: JSON.stringify(updatedManifest, null, 2),
      sha: manifestSha,
    })

    return updatedManifest
  }

  return {
    octokit,
    fetchAllItems,
    fetchManifest,
    fetchVersionFile,
    downloadFile,
    putFile,
    getFileSha,
    createIssue,
    fetchIssueComments,
    postIssueComment,
    uploadNewItem,
    uploadNewVersion,
    approveVersion,
    rejectVersion,
  }
}
